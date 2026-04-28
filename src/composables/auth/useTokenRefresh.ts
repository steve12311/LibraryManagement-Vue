import { useAuthStoreHook, useUserStoreHook } from "@/store";
import type { HttpRequestExecutor, RetryRequestConfig } from "@/types/request";
import { redirectToLogin } from "@/utils/auth";

type PendingRequest = {
    config: RetryRequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
};

const MAX_REFRESH_RETRY_COUNT = 1;

/**
 * Token 刷新与请求重试编排。
 * 核心策略：多个 401 请求并发时，只触发一次 token 刷新，其余请求排队等待，
 * 刷新成功后统一重放；刷新失败则全部 reject 并跳转登录。
 */
export function useTokenRefresh() {
    let isRefreshingToken = false;
    let isRedirectingToLogin = false;
    const pendingRequests: PendingRequest[] = [];

    function applyAccessToken(config: RetryRequestConfig) {
        const newToken = useAuthStoreHook().accessToken;
        if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
        }
    }

    function rejectAllPending(error: unknown) {
        const failedRequests = [...pendingRequests];
        pendingRequests.length = 0;
        failedRequests.forEach((request) => request.reject(error));
    }

    /**
     * 刷新 Token 并重试请求。并发请求排队，只刷新一次 token 后统一重放。
     * @returns Promise — 重试请求的结果
     */
    async function refreshTokenAndRetry(
        config: RetryRequestConfig,
        httpRequest: HttpRequestExecutor
    ): Promise<unknown> {
        if (config._skipAuthRefresh) {
            return Promise.reject(new Error("当前请求禁止自动刷新令牌"));
        }

        const retryCount = config._retryCount ?? 0;
        if (retryCount >= MAX_REFRESH_RETRY_COUNT) {
            return Promise.reject(new Error("令牌刷新重试次数超限"));
        }

        return new Promise((resolve, reject) => {
            // 当前请求入队
            pendingRequests.push({config, resolve, reject});

            // 已有刷新进行中，仅排队等待
            if (isRefreshingToken) return;

            // 发起 token 刷新
            isRefreshingToken = true;
            useUserStoreHook()
                .refreshToken()
                .then(() => {
                    // 刷新成功 → 取出所有排队请求，更新 token 并重放
                    const successRequests = [...pendingRequests];
                    pendingRequests.length = 0;
                    successRequests.forEach((request) => {
                        request.config._retryCount = (request.config._retryCount ?? 0) + 1;
                        applyAccessToken(request.config);
                        httpRequest(request.config)
                            .then(request.resolve)
                            .catch(request.reject);
                    });
                })
                .catch(async (error) => {
                    console.error("Token refresh failed:", error);
                    // 刷新失败 → 全部排队请求 reject
                    rejectAllPending(new Error("Token refresh failed"));
                    // 只跳转一次登录页
                    if (!isRedirectingToLogin) {
                        isRedirectingToLogin = true;
                        await redirectToLogin("登录状态已失效，请重新登录");
                        isRedirectingToLogin = false;
                    }
                })
                .finally(() => {
                    isRefreshingToken = false;
                });
        });
    }

    function getRefreshStatus() {
        return {
            isRefreshing: isRefreshingToken,
            pendingCount: pendingRequests.length,
        };
    }

    return {
        refreshTokenAndRetry,
        getRefreshStatus,
    };
}
