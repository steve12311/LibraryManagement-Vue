import type {InternalAxiosRequestConfig} from "axios";
import {useUserStoreHook} from "@/store";
import {useAuthStoreHook} from "@/store";
import {redirectToLogin} from "@/utils/auth.ts";

/**
 * 可重试请求配置
 */
type RetryRequestConfig = InternalAxiosRequestConfig & {
    _retryCount?: number;
    _skipAuthRefresh?: boolean;
};

type PendingRequest = {
    config: RetryRequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
};

const MAX_REFRESH_RETRY_COUNT = 1;

/**
 * Token刷新组合式函数
 */
export function useTokenRefresh() {
    // Token 刷新相关状态
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
     * 刷新 Token 并重试请求
     */
    async function refreshTokenAndRetry(
        config: RetryRequestConfig,
        httpRequest: any
    ): Promise<any> {
        if (config._skipAuthRefresh) {
            return Promise.reject(new Error("当前请求禁止自动刷新令牌"));
        }

        const retryCount = config._retryCount ?? 0;
        if (retryCount >= MAX_REFRESH_RETRY_COUNT) {
            return Promise.reject(new Error("令牌刷新重试次数超限"));
        }

        return new Promise((resolve, reject) => {
            pendingRequests.push({config, resolve, reject});

            if (isRefreshingToken) {
                return;
            }

            isRefreshingToken = true;
            useUserStoreHook()
                .refreshToken()
                .then(() => {
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
                    rejectAllPending(new Error("Token refresh failed"));
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

    /**
     * 获取刷新状态（用于外部判断）
     */
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
