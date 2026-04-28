import { useAuthStoreHook, useUserStoreHook } from "@/store";
import { redirectToLogin } from "@/utils/auth";

const CHAT_PATH = "/chat";
const AUTH_EXPIRED_MESSAGE = "登录状态已失效，请重新登录";

type ChatStreamErrorCode = "AUTH_EXPIRED" | "HTTP_ERROR" | "NETWORK_ERROR" | "INVALID_RESPONSE";

interface ChatStreamOptions {
    message: string;
    signal: AbortSignal;
    onChunk: (payload: unknown) => void;
}

/** 聊天流错误，携带错误分类码和 HTTP 状态码 */
export class ChatStreamError extends Error {
    code: ChatStreamErrorCode;
    status?: number;

    constructor(code: ChatStreamErrorCode, message: string, status?: number) {
        super(message);
        this.name = "ChatStreamError";
        this.code = code;
        this.status = status;
    }
}

/**
 * 发送聊天消息并消费 SSE 流。401 时自动刷新 token 并重试一次。
 */
export async function streamChat(options: ChatStreamOptions): Promise<void> {
    const response = await sendChatRequest(options.message, options.signal, true);
    await consumeResponse(response, options);
}

/**
 * 发送聊天请求。
 * 流程：fetch → 401检查（触发 token 刷新重试）→ HTTP 错误转换 → 返回 Response
 * @param allowRetry false 时不再递归重试，直接跳转登录（防止无限循环）
 */
async function sendChatRequest(
    message: string,
    signal: AbortSignal,
    allowRetry: boolean
): Promise<Response> {
    let response: Response;

    try {
        response = await fetch(buildChatUrl(message), {
            method: "GET",
            headers: buildChatHeaders(),
            signal,
        });
    } catch (error) {
        if (isAbortError(error)) throw error;
        throw new ChatStreamError("NETWORK_ERROR", "网络连接失败，请稍后重试");
    }

    // 401 → 刷新 token 后重试
    if (response.status === 401) {
        return retryAfterRefresh(message, signal, allowRetry);
    }

    if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new ChatStreamError("HTTP_ERROR", errorMessage, response.status);
    }

    return response;
}

/**
 * 刷新 token 后重新发送请求。
 * 仅允许一次重试（allowRetry=false 时直接跳登录），防止无限递归。
 */
async function retryAfterRefresh(
    message: string,
    signal: AbortSignal,
    allowRetry: boolean
): Promise<Response> {
    if (!allowRetry) {
        await redirectToLogin(AUTH_EXPIRED_MESSAGE);
        throw new ChatStreamError("AUTH_EXPIRED", AUTH_EXPIRED_MESSAGE, 401);
    }

    try {
        await useUserStoreHook().refreshToken();
    } catch (error) {
        if (isAbortError(error)) throw error;
        await redirectToLogin(AUTH_EXPIRED_MESSAGE);
        throw new ChatStreamError("AUTH_EXPIRED", AUTH_EXPIRED_MESSAGE, 401);
    }

    // 重试，allowRetry=false 防止再次递归
    return sendChatRequest(message, signal, false);
}

/**
 * 按 Content-Type 分流处理响应体：
 * application/json → 直接 parse → onChunk
 * text/event-stream → SSE 逐行读取 → 解析 data: 行 → onChunk(JSON)
 * 其余 → 当纯文本 → onChunk
 */
async function consumeResponse(response: Response, options: ChatStreamOptions) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        options.onChunk(await response.json());
        return;
    }

    if (!response.body) {
        throw new ChatStreamError("INVALID_RESPONSE", "AI 服务未返回可读取的数据流", response.status);
    }

    if (!contentType.includes("text/event-stream")) {
        options.onChunk(await response.text());
        return;
    }

    // SSE 流式读取
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pendingLine = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            pendingLine += decoder.decode(value, { stream: true });
            // 按 \n 切分，最后一段不完整行留到下次拼接
            pendingLine = flushLines(pendingLine, options.onChunk);
        }

        // flush 解码器缓冲区残留
        pendingLine += decoder.decode();
        flushRemainingLine(pendingLine, options.onChunk);
    } finally {
        reader.releaseLock();
    }
}

/** 将缓冲区按行切分，完整行送入 consumeLine，最后一段不完整行返回 */
function flushLines(buffer: string, onChunk: (payload: unknown) => void) {
    const lines = buffer.split(/\r?\n/);
    const pendingLine = lines.pop() ?? "";

    lines.forEach((line) => {
        consumeLine(line, onChunk);
    });

    return pendingLine;
}

/** 处理流结束后残留的最后一行 */
function flushRemainingLine(line: string, onChunk: (payload: unknown) => void) {
    const trimmed = line.trim();
    if (!trimmed) return;
    consumeLine(trimmed, onChunk);
}

/** 解析单行 SSE 数据：跳过注释行(:)、空行、非 data: 行、[DONE] 标记 */
function consumeLine(line: string, onChunk: (payload: unknown) => void) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) {
        return;
    }

    const rawPayload = trimmed.slice(5).trim();
    if (!rawPayload || rawPayload === "[DONE]") return;

    try {
        onChunk(JSON.parse(rawPayload));
    } catch (error) {
        console.error("Failed to parse SSE chat payload:", error);
    }
}

function buildChatHeaders() {
    const headers = new Headers({
        Accept: "text/event-stream",
    });
    const accessToken = useAuthStoreHook().accessToken;
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
}

function buildChatUrl(message: string) {
    const baseURL = resolveBaseURL();
    const normalizedBaseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    const url = new URL(CHAT_PATH.replace(/^\//, ""), normalizedBaseURL);
    url.searchParams.set("message", message);
    return url.toString();
}

function resolveBaseURL() {
    if (import.meta.env.VITE_APP_API_URL) {
        return import.meta.env.VITE_APP_API_URL;
    }
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return "";
}

/**
 * 从错误响应中提取可读错误消息。
 * JSON → msg 字段 | 纯文本 → 截取 | 兜底 → 状态码对应文案
 */
async function extractErrorMessage(response: Response) {
    try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            const payload = await response.json() as { msg?: string };
            if (payload.msg) return payload.msg;
        } else {
            const text = await response.text();
            if (text.trim()) return text.trim();
        }
    } catch (error) {
        console.error("Failed to extract chat error message:", error);
    }

    if (response.status >= 500) {
        return "AI 服务暂时不可用，请稍后重试";
    }

    return "AI 请求失败，请稍后重试";
}

function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === "AbortError";
}
