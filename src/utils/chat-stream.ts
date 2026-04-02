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

export async function streamChat(options: ChatStreamOptions): Promise<void> {
    const response = await sendChatRequest(options.message, options.signal, true);
    await consumeResponse(response, options);
}

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
        if (isAbortError(error)) {
            throw error;
        }
        throw new ChatStreamError("NETWORK_ERROR", "网络连接失败，请稍后重试");
    }

    if (response.status === 401) {
        return retryAfterRefresh(message, signal, allowRetry);
    }

    if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new ChatStreamError("HTTP_ERROR", errorMessage, response.status);
    }

    return response;
}

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
        if (isAbortError(error)) {
            throw error;
        }
        await redirectToLogin(AUTH_EXPIRED_MESSAGE);
        throw new ChatStreamError("AUTH_EXPIRED", AUTH_EXPIRED_MESSAGE, 401);
    }

    return sendChatRequest(message, signal, false);
}

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

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pendingLine = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            pendingLine += decoder.decode(value, { stream: true });
            pendingLine = flushLines(pendingLine, options.onChunk);
        }

        pendingLine += decoder.decode();
        flushRemainingLine(pendingLine, options.onChunk);
    } finally {
        reader.releaseLock();
    }
}

function flushLines(buffer: string, onChunk: (payload: unknown) => void) {
    const lines = buffer.split(/\r?\n/);
    const pendingLine = lines.pop() ?? "";

    lines.forEach((line) => {
        consumeLine(line, onChunk);
    });

    return pendingLine;
}

function flushRemainingLine(line: string, onChunk: (payload: unknown) => void) {
    const trimmed = line.trim();
    if (!trimmed) {
        return;
    }
    consumeLine(trimmed, onChunk);
}

function consumeLine(line: string, onChunk: (payload: unknown) => void) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) {
        return;
    }

    const rawPayload = trimmed.slice(5).trim();
    if (!rawPayload || rawPayload === "[DONE]") {
        return;
    }

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

async function extractErrorMessage(response: Response) {
    try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            const payload = await response.json() as { msg?: string };
            if (payload.msg) {
                return payload.msg;
            }
        } else {
            const text = await response.text();
            if (text.trim()) {
                return text.trim();
            }
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
