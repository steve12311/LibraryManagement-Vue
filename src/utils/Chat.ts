import type {UIMessage} from "ai";
import type {AxiosProgressEvent} from "axios";
import request from "./request.ts";
import {ref} from "vue";

type ChatStatus = "error" | "submitted" | "streaming" | "ready";

type ChatMessageType = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";

interface ChatToolCall {
    id?: string;
    type?: string;
    name?: string;
    arguments?: string;
}

interface ChatAssistantMessage {
    messageType?: ChatMessageType;
    textContent?: string | null;
    toolCalls?: ChatToolCall[];
}

interface ChatGeneration {
    assistantMessage?: ChatAssistantMessage;
}

interface ChatResponseChunk {
    generations?: ChatGeneration[];
    result?: {
        output?: {
            text?: string;
        };
    };
}

interface StreamParserState {
    consumedLength: number;
    pendingLine: string;
    hasParsedChunk: boolean;
}

export class AIChat {
    static readonly AI_BASE_URL = "/chat";
    static readonly MAX_MESSAGE_LENGTH = 1000;

    constructor({messages}: { messages?: UIMessage[] }) {
        this.messages.value = messages ?? []
    }

    messages = ref<UIMessage[]>([])
    status = ref<ChatStatus>("ready")
    private controller = new AbortController()
    private tempInput = ""

    sendMessage(text: string): Promise<void> {
        const normalizedText = text.trim();
        if (!normalizedText) {
            return Promise.resolve();
        }
        if (normalizedText.length > AIChat.MAX_MESSAGE_LENGTH) {
            console.warn(`Chat input is too long. max=${AIChat.MAX_MESSAGE_LENGTH}`);
            return Promise.resolve();
        }

        if (this.status.value === "submitted" || this.status.value === "streaming") {
            return Promise.resolve();
        }

        this.tempInput = normalizedText;
        const userMessage = this.createTextMessage("user", normalizedText);
        const assistantMessage = this.createTextMessage("assistant", "");
        this.messages.value.push(userMessage, assistantMessage);
        const assistantIndex = this.messages.value.length - 1;

        this.status.value = "submitted";
        this.status.value = "streaming";

        const parserState: StreamParserState = {
            consumedLength: 0,
            pendingLine: "",
            hasParsedChunk: false,
        };

        return request({
            url: AIChat.AI_BASE_URL,
            method: "get",
            params: {
                message: normalizedText,
            },
            signal: this.controller.signal,
            responseType: "stream",
            onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                this.consumeStream(progressEvent, parserState, assistantIndex);
            }
        })
            .then((response) => {
                this.flushPendingLine(parserState, assistantIndex);

                // Fallback for non-SSE payloads where only final JSON body is available.
                if (!parserState.hasParsedChunk) {
                    const fallbackText = this.extractTextFromUnknownResponse(response);
                    this.appendAssistantText(assistantIndex, fallbackText);
                }
                this.status.value = "ready";
            })
            .catch((error: unknown) => {
                if (this.isAbortError(error)) {
                    this.status.value = "ready";
                    return;
                }

                this.status.value = "error";
                console.error("Chat request failed:", error);
            })
            .finally(() => {
                this.controller = new AbortController();
            });
    }

    stop() {
        this.controller.abort();
        this.status.value = "ready";
        this.controller = new AbortController();
    }

    reload() {
        return this.sendMessage(this.tempInput);
    }

    private createTextMessage(role: "user" | "assistant", text: string): UIMessage {
        return {
            id: this.createMessageId(),
            role,
            parts: [
                {
                    type: "text",
                    text,
                }
            ],
        };
    }

    private createMessageId() {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    private consumeStream(
        progressEvent: AxiosProgressEvent,
        parserState: StreamParserState,
        assistantIndex: number
    ) {
        const xhr = progressEvent.event?.target as { responseText?: string } | undefined;
        const responseText = xhr?.responseText;
        if (!responseText || responseText.length <= parserState.consumedLength) {
            return;
        }

        const newChunk = responseText.slice(parserState.consumedLength);
        parserState.consumedLength = responseText.length;
        parserState.pendingLine += newChunk;

        const lines = parserState.pendingLine.split(/\r?\n/);
        parserState.pendingLine = lines.pop() ?? "";

        lines.forEach((line) => {
            this.consumeLine(line, parserState, assistantIndex);
        });
    }

    private flushPendingLine(parserState: StreamParserState, assistantIndex: number) {
        const line = parserState.pendingLine.trim();
        if (line) {
            this.consumeLine(line, parserState, assistantIndex);
        }
        parserState.pendingLine = "";
    }

    private consumeLine(line: string, parserState: StreamParserState, assistantIndex: number) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
            return;
        }

        const jsonText = trimmed.slice(5).trim();
        if (!jsonText || jsonText === "[DONE]") {
            return;
        }

        try {
            const payload = JSON.parse(jsonText) as unknown;
            parserState.hasParsedChunk = true;
            const deltaText = this.extractTextFromPayload(payload);
            this.appendAssistantText(assistantIndex, deltaText);
        } catch (error) {
            console.error("Failed to parse chat stream chunk:", error);
        }
    }

    private extractTextFromUnknownResponse(response: unknown): string {
        if (!response || typeof response !== "object") {
            return "";
        }

        const responseData = (response as { data?: unknown }).data;
        return this.extractTextFromPayload(responseData);
    }

    private extractTextFromPayload(payload: unknown): string {
        if (!payload) {
            return "";
        }

        if (Array.isArray(payload)) {
            return payload.map((item) => this.extractTextFromPayload(item)).join("");
        }

        if (typeof payload !== "object") {
            return "";
        }

        const chunk = payload as ChatResponseChunk & { data?: unknown };

        // OpenAPI contract: generations[].assistantMessage.textContent
        const generatedText = chunk.generations
            ?.map((generation) => generation.assistantMessage?.textContent ?? "")
            .join("") ?? "";
        if (generatedText) {
            return generatedText;
        }

        // Backward compatibility: result.output.text (legacy format)
        const legacyText = chunk.result?.output?.text ?? "";
        if (legacyText) {
            return legacyText;
        }

        // Some gateways wrap payload inside data.
        if (chunk.data !== undefined) {
            return this.extractTextFromPayload(chunk.data);
        }

        return "";
    }

    private appendAssistantText(assistantIndex: number, deltaText: string) {
        if (!deltaText) {
            return;
        }

        const assistantMessage = this.messages.value[assistantIndex];
        if (!assistantMessage) {
            return;
        }

        const textPart = assistantMessage.parts.find(
            (part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text"
        );

        if (textPart) {
            textPart.text += deltaText;
            return;
        }

        assistantMessage.parts.push({
            type: "text",
            text: deltaText,
        });
    }

    private isAbortError(error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return true;
        }

        if (!error || typeof error !== "object") {
            return false;
        }

        const err = error as { name?: string; code?: string };
        return err.name === "AbortError" || err.code === "ERR_CANCELED";
    }
}
