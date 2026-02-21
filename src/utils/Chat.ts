import type {UIMessage} from "ai";
import request from "./request.ts";
import {ref} from "vue";

export interface ChatResponse {
    result: {
        output: {
            reasoningContent: string,
            prefix: string | null
            toolCalls: []
            media: [],
            metadata: {
                finishReason: "" | "STOP"
                role: "ASSISTANT"
                id: string
                messageType: "ASSISTANT"
            },
            messageType: "ASSISTANT",
            text: string
        }
    }
}

export class AIChat {
    static AI_BASE_URL = "/chat";

    constructor({messages}: { messages?: UIMessage[] }) {
        this.messages.value = messages ?? []
    }

    messages = ref<UIMessage[]>([])
    status = ref<"error" | "submitted" | "streaming" | "ready">("ready")
    controller = new AbortController()
    tempInput = ""

    sendMessage(text: string) {
        this.tempInput = text
        this.messages.value.push({
            id: new Date().getTime().toString(),
            role: "user",
            parts: [{
                type: "text",
                text: text
            }]
        })
        this.status.value = "submitted"
        this.messages.value.push({
            id: new Date().getTime().toString(),
            role: "assistant",
            parts: [{
                type: "text",
                text: ""
            }]
        })
        this.status.value = "streaming"
        let accumulatedResponse = ""
        request({
            url: AIChat.AI_BASE_URL,
            method: "get",
            params: {
                message: text
            },
            signal: this.controller.signal,
            responseType: "stream",
            onDownloadProgress: (progressEvent) => {
                const xhr: { responseText: string } = progressEvent.event.target;
                const lastestResponse = xhr.responseText.substring(accumulatedResponse.length)
                accumulatedResponse += lastestResponse
                lastestResponse.split("\n").forEach((line) => {
                    if (line.startsWith("data:")) {
                        const data = JSON.parse(line.substring(5)) as ChatResponse
                        this.messages.value[this.messages.value.length - 1]?.parts.push({
                            type: "text",
                            text: data.result.output.text
                        })
                    }
                })
            }
        })
            .then(() => {
                console.log(this.messages.value[this.messages.value.length - 1])
                this.status.value = "ready"
            })
            .catch((error) => {
                this.status.value = "error"
                console.error(error);
            })
    }

    stop() {
        this.controller.abort()
        this.controller = new AbortController()
    }

    reload() {
        this.sendMessage(this.tempInput)
    }
}