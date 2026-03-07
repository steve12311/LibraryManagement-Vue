import qs from "qs";
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { ApiCodeEnum } from "@/enums/api/code-enum";
import { authConfig } from "@/settings";
import { useTokenRefresh } from "@/composables/auth/useTokenRefresh";
import {useAuthStoreHook} from "@/store";
import type { RetryRequestConfig } from "@/types/request";
import {redirectToLogin} from "@/utils/auth";

const {refreshTokenAndRetry} = useTokenRefresh();

/**
 * 创建 HTTP 请求实例
 */
const httpRequest = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    timeout: 50000,
    headers: {"Content-Type": "application/json;charset=utf-8"},
    paramsSerializer: (params) => qs.stringify(params),
});

/**
 * 请求拦截器 - 添加 Authorization 头
 */
httpRequest.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RetryRequestConfig;
        const accessToken = useAuthStoreHook().accessToken;

        // Let axios set proper multipart boundary for FormData
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        // 如果 Authorization 设置为 no-auth，则不携带 Token
        if (config.headers.Authorization !== "no-auth" && accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            requestConfig._skipAuthRefresh = false;
        } else {
            requestConfig._skipAuthRefresh = true;
            delete config.headers.Authorization;
        }

        return requestConfig;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);
/**
 * 响应拦截器 - 统一处理响应和错误
 */
function unwrapResponse(response: AxiosResponse<ApiResponse<unknown>>): any {
    const toast = useToast()
    // 如果响应是二进制数据，则直接返回response对象（用于文件下载、Excel导出、图片显示等）
    if (response.config.responseType === "stream" || response.config.responseType === "blob" || response.config.responseType === "arraybuffer") {
        return response;
    }

    const {code, data, msg} = response.data;

    // 请求成功
    if (code === ApiCodeEnum.SUCCESS) {
        return data;
    }

    // 业务错误
    toast.add({title: "错误", description: msg || "系统出错", color: "error"})
    return Promise.reject(new Error(msg || "Business Error"));
}

httpRequest.interceptors.response.use(
    unwrapResponse,
    async (error: AxiosError<Partial<ApiResponse<unknown>>>) => {
        const toast = useToast()
        console.error("Response interceptor error:", error);

        const requestConfig = (error.config || {}) as RetryRequestConfig;
        const response = error.response;

        // 网络错误或服务器无响应
        if (!response) {
            toast.add({title: "错误", description: "网络连接失败，请检查网络设置", color: "error"})
            return Promise.reject(error);
        }

        const data = response.data as Partial<ApiResponse<unknown>> | undefined;
        const code = data?.code;
        const msg = data?.msg;

        // HTTP 状态兜底处理
        if ((response.status === 401 || response.status === 403) && authConfig.enableTokenRefresh && !requestConfig._skipAuthRefresh) {
            return refreshTokenAndRetry(requestConfig, httpRequest);
        }

        switch (code) {
            case ApiCodeEnum.ACCESS_TOKEN_INVALID:
                // Access Token 过期
                if (authConfig.enableTokenRefresh && !requestConfig._skipAuthRefresh) {
                    // 启用了token刷新，尝试刷新
                    return refreshTokenAndRetry(requestConfig, httpRequest);
                } else {
                    // 未启用token刷新，直接跳转登录页
                    await redirectToLogin("登录已过期，请重新登录");
                    return Promise.reject(new Error(msg || "Access Token Invalid"));
                }

            case ApiCodeEnum.REFRESH_TOKEN_INVALID:
                // Refresh Token 过期，跳转登录页
                await redirectToLogin("登录已过期，请重新登录");
                return Promise.reject(new Error(msg || "Refresh Token Invalid"));

            default:
                toast.add({title: "错误", description: msg || "请求失败", color: "error"})
                return Promise.reject(new Error(msg || "Request Error"));
        }
    }
);

export default httpRequest;
