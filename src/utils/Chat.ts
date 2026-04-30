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
    reasoningContent?: string | null;
    toolCalls?: ChatToolCall[];
}

interface ChatOutput {
    text?: string | null;
    reasoningContent?: string | null;
}

interface ChatGeneration {
    assistantMessage?: ChatAssistantMessage;
    output?: ChatOutput;
}

interface ChatResult {
    output?: ChatOutput | null;
}

interface ChatResponseChunk {
    generations?: ChatGeneration[];
    results?: ChatResult[];
    result?: ChatResult | null;
    data?: unknown;
}

interface ParsedChatContent {
    text: string;
    reasoning: string;
}

type ChatPart = UIMessage["parts"][number];
type ChatTextPart = Extract<ChatPart, { type: "text" }>;
type ChatReasoningPart = Extract<ChatPart, { type: "reasoning" }>;

/**
 * AI 聊天会话管理器，封装消息流、SSE 流读取、错误恢复与状态管理。
 */
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

    /**
     * 发送聊天消息。
     * 流程：校验 → 创建 user/assistant 占位 → 发起 SSE 流 → 逐 chunk 追加文本 → 完成/错误处理。
     */
    sendMessage(text: string): Promise<void> {
        // 校验输入
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

        // 准备消息槽位
        this.tempInput = normalizedText;
        this.errorMessage.value = "";
        const userMessage = this.createTextMessage("user", normalizedText);
        const assistantMessage = this.createTextMessage("assistant", "");
        this.messages.value.push(userMessage, assistantMessage);
        const assistantIndex = this.messages.value.length - 1;

        // 开始流式请求
        this.status.value = "submitted";
        this.status.value = "streaming";
        let hasContentChunk = false;
        const requestController = new AbortController();
        this.controller = requestController;

        return streamChat({
            message: normalizedText,
            signal: requestController.signal,
            onChunk: (payload) => {
                const deltaContent = this.extractContentFromPayload(payload);
                if (!deltaContent.text && !deltaContent.reasoning) {
                    return;
                }
                hasContentChunk = true;
                this.appendAssistantReasoning(assistantIndex, deltaContent.reasoning);
                this.appendAssistantText(assistantIndex, deltaContent.text);
            }
        })
            .then(() => {
                this.finishAssistantParts(assistantIndex);
                if (!hasContentChunk) {
                    this.errorMessage.value = "AI 服务暂未返回有效内容，请稍后重试";
                    this.status.value = "error";
                    return;
                }
                this.status.value = "ready";
            })
            .catch((error: unknown) => {
                this.finishAssistantParts(assistantIndex);
                // 用户主动停止 → 恢复 ready
                if (this.isAbortError(error)) {
                    this.status.value = "ready";
                    return;
                }

                this.status.value = "error";
                this.errorMessage.value = this.resolveErrorMessage(error);
                console.error("Chat request failed:", error);
            })
            .finally(() => {
                // 重置 AbortController 以便下次请求
                this.finishAssistantParts(assistantIndex);
                if (this.controller === requestController) {
                    this.controller = new AbortController();
                }
            });
    }

    /** 中止当前请求 */
    stop() {
        this.controller.abort();
        this.finishStreamingParts();
        this.status.value = "ready";
        this.controller = new AbortController();
    }

    /** 使用同一条输入重新发送 */
    reload() {
        return this.sendMessage(this.tempInput);
    }

    /** 清除错误提示 */
    clearError() {
        this.errorMessage.value = "";
    }

    private createTextMessage(role: "user" | "assistant", text: string): UIMessage {
        const parts: UIMessage["parts"] = text
            ? [
                {
                    type: "text",
                    text,
                    state: role === "assistant" ? "streaming" : "done",
                }
            ]
            : [];

        return {
            id: this.createMessageId(),
            role,
            parts,
        };
    }

    private createMessageId() {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    /**
     * 从 AI 响应 payload 中提取文本与思考内容。兼容多种格式：
     * 纯文本 → 直接返回 | 数组 → 递归拼接 |
     * ChatGeneration.textContent → result/results.output → data 递归
     */
    private extractContentFromPayload(payload: unknown): ParsedChatContent {
        const content: ParsedChatContent = {text: "", reasoning: ""};
        this.collectContentFromPayload(payload, content, new Set<string>(), new WeakSet<object>());
        return content;
    }

    private collectContentFromPayload(
        payload: unknown,
        content: ParsedChatContent,
        seenStructuredContent: Set<string>,
        seenObjects: WeakSet<object>
    ) {
        if (!payload) return;

        if (typeof payload === "string") {
            content.text += payload;
            return;
        }

        if (Array.isArray(payload)) {
            payload.forEach((item) => {
                this.collectContentFromPayload(item, content, seenStructuredContent, seenObjects);
            });
            return;
        }

        if (typeof payload !== "object") return;
        if (seenObjects.has(payload)) return;
        seenObjects.add(payload);

        const chunk = payload as ChatResponseChunk;

        chunk.generations?.forEach((generation) => {
            this.appendStructuredContent(
                content,
                generation.assistantMessage?.textContent,
                generation.assistantMessage?.reasoningContent,
                seenStructuredContent
            );
            this.appendStructuredContent(
                content,
                generation.output?.text,
                generation.output?.reasoningContent,
                seenStructuredContent
            );
        });

        chunk.results?.forEach((result) => {
            this.appendStructuredContent(
                content,
                result.output?.text,
                result.output?.reasoningContent,
                seenStructuredContent
            );
        });

        this.appendStructuredContent(
            content,
            chunk.result?.output?.text,
            chunk.result?.output?.reasoningContent,
            seenStructuredContent
        );

        // 嵌套 data 字段，继续递归
        if (chunk.data !== undefined) {
            this.collectContentFromPayload(chunk.data, content, seenStructuredContent, seenObjects);
        }
    }

    private appendStructuredContent(
        content: ParsedChatContent,
        textValue: string | null | undefined,
        reasoningValue: string | null | undefined,
        seenStructuredContent: Set<string>
    ) {
        const text = textValue ?? "";
        const reasoning = reasoningValue ?? "";
        if (!text && !reasoning) return;

        const contentKey = `${text}\u0000${reasoning}`;
        if (seenStructuredContent.has(contentKey)) return;
        seenStructuredContent.add(contentKey);

        content.text += text;
        content.reasoning += reasoning;
    }

    /**
     * 根据错误类型生成用户提示。AUTH_EXPIRED 不展示错误（已由重定向处理），
     * 流式错误直接透传消息，其余返回兜底文案。
     */
    private resolveErrorMessage(error: unknown) {
        if (error instanceof ChatStreamError) {
            if (error.code === "AUTH_EXPIRED") {
                return "";
            }
            return error.message;
        }

        return "AI 请求失败，请稍后重试";
    }

    /** 将 deltaText 追加到 assistant 消息的 text part */
    private appendAssistantText(assistantIndex: number, deltaText: string) {
        if (!deltaText) return;

        const assistantMessage = this.messages.value[assistantIndex];
        if (!assistantMessage) return;

        const textPart = assistantMessage.parts.find((part): part is ChatTextPart => part.type === "text");

        if (textPart) {
            textPart.text += deltaText;
            textPart.state = "streaming";
            return;
        }

        assistantMessage.parts.push({
            type: "text",
            text: deltaText,
            state: "streaming",
        });
    }

    /** 将 deltaReasoning 追加到 assistant 消息的 reasoning part */
    private appendAssistantReasoning(assistantIndex: number, deltaReasoning: string) {
        if (!deltaReasoning) return;

        const assistantMessage = this.messages.value[assistantIndex];
        if (!assistantMessage) return;

        const reasoningPart = assistantMessage.parts.find(
            (part): part is ChatReasoningPart => part.type === "reasoning"
        );

        if (reasoningPart) {
            reasoningPart.text += deltaReasoning;
            reasoningPart.state = "streaming";
            return;
        }

        assistantMessage.parts.push({
            type: "reasoning",
            text: deltaReasoning,
            state: "streaming",
        });
    }

    private finishAssistantParts(assistantIndex: number) {
        const assistantMessage = this.messages.value[assistantIndex];
        if (!assistantMessage) return;

        assistantMessage.parts.forEach((part) => {
            if (this.isStreamContentPart(part)) {
                part.state = "done";
            }
        });
    }

    private finishStreamingParts() {
        this.messages.value.forEach((message) => {
            message.parts.forEach((part) => {
                if (this.isStreamContentPart(part)) {
                    part.state = "done";
                }
            });
        });
    }

    private isStreamContentPart(part: ChatPart): part is ChatTextPart | ChatReasoningPart {
        return part.type === "text" || part.type === "reasoning";
    }

    /**
     * 判断是否为主动中止错误（DOM AbortError 或 axios ERR_CANCELED）。
     * 主动中止不应展示错误提示，直接恢复 ready 状态。
     */
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
