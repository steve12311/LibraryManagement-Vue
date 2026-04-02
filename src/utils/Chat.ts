import type {UIMessage} from "ai";
import { ChatStreamError, streamChat } from "./chat-stream.ts";
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

export class AIChat {
    static readonly MAX_MESSAGE_LENGTH = 1000;

    constructor({messages}: { messages?: UIMessage[] }) {
        this.messages.value = messages ?? []
    }

    messages = ref<UIMessage[]>([])
    status = ref<ChatStatus>("ready")
    errorMessage = ref("")
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
        this.errorMessage.value = "";
        const userMessage = this.createTextMessage("user", normalizedText);
        const assistantMessage = this.createTextMessage("assistant", "");
        this.messages.value.push(userMessage, assistantMessage);
        const assistantIndex = this.messages.value.length - 1;

        this.status.value = "submitted";
        this.status.value = "streaming";
        let hasParsedChunk = false;

        return streamChat({
            message: normalizedText,
            signal: this.controller.signal,
            onChunk: (payload) => {
                hasParsedChunk = true;
                const deltaText = this.extractTextFromPayload(payload);
                this.appendAssistantText(assistantIndex, deltaText);
            }
        })
            .then(() => {
                if (!hasParsedChunk) {
                    this.errorMessage.value = "AI 服务暂未返回有效内容，请稍后重试";
                    this.status.value = "error";
                    return;
                }
                this.status.value = "ready";
            })
            .catch((error: unknown) => {
                if (this.isAbortError(error)) {
                    this.status.value = "ready";
                    return;
                }

                this.status.value = "error";
                this.errorMessage.value = this.resolveErrorMessage(error);
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

    clearError() {
        this.errorMessage.value = "";
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

    private extractTextFromPayload(payload: unknown): string {
        if (!payload) {
            return "";
        }

        if (typeof payload === "string") {
            return payload;
        }

        if (Array.isArray(payload)) {
            return payload.map((item) => this.extractTextFromPayload(item)).join("");
        }

        if (typeof payload !== "object") {
            return "";
        }

        const chunk = payload as ChatResponseChunk & { data?: unknown };

        const generatedText = chunk.generations
            ?.map((generation) => generation.assistantMessage?.textContent ?? "")
            .join("") ?? "";
        if (generatedText) {
            return generatedText;
        }

        const legacyText = chunk.result?.output?.text ?? "";
        if (legacyText) {
            return legacyText;
        }

        if (chunk.data !== undefined) {
            return this.extractTextFromPayload(chunk.data);
        }

        return "";
    }

    private resolveErrorMessage(error: unknown) {
        if (error instanceof ChatStreamError) {
            if (error.code === "AUTH_EXPIRED") {
                return "";
            }
            return error.message;
        }

        return "AI 请求失败，请稍后重试";
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
