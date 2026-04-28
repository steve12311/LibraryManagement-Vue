import qs from "qs";
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { ApiCodeEnum } from "@/enums/api/code-enum";
import { authConfig } from "@/settings";
import { useTokenRefresh } from "@/composables/auth/useTokenRefresh";
import {useAuthStoreHook} from "@/store";
import type { RetryRequestConfig } from "@/types/request";
import {redirectToLogin} from "@/utils/auth";

const {refreshTokenAndRetry} = useTokenRefresh();
type BinaryResponseData = Blob | ArrayBuffer | ReadableStream<Uint8Array>;
const BUSINESS_ACCESS_DENIED_CODE = "A0301";

const httpRequest = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    timeout: 50000,
    headers: {"Content-Type": "application/json;charset=utf-8"},
    paramsSerializer: (params) => qs.stringify(params),
});

httpRequest.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RetryRequestConfig;
        const accessToken = useAuthStoreHook().accessToken;

        // 删除 Content-Type 让 axios 为 FormData 自动设置带 boundary 的 multipart header
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        if (config.headers.Authorization !== "no-auth" && accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            requestConfig._skipAuthRefresh = false;
        } else {
            requestConfig._skipAuthRefresh = true;
            delete config.headers.Authorization;
        }

        return requestConfig;
    },
    (error) => Promise.reject(error)
);

function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>): T | AxiosResponse<BinaryResponseData> {
    const toast = useToast()

    if (response.config.responseType === "stream" || response.config.responseType === "blob" || response.config.responseType === "arraybuffer") {
        return response as unknown as AxiosResponse<BinaryResponseData>;
    }

    const {code, data, msg} = response.data;

    if (code === ApiCodeEnum.SUCCESS) {
        return data;
    }

    toast.add({title: "错误", description: msg || "系统出错", color: "error"})
    throw new Error(msg || "Business Error");
}

httpRequest.interceptors.response.use(
    unwrapResponse,
    async (error: AxiosError<Partial<ApiResponse<unknown>>>) => {
        const toast = useToast()

        const requestConfig = (error.config || {}) as RetryRequestConfig;
        const response = error.response;

        if (!response) {
            toast.add({title: "错误", description: "网络连接失败，请检查网络设置", color: "error"})
            return Promise.reject(error);
        }

        const data = response.data as Partial<ApiResponse<unknown>> | undefined;
        const code = data?.code;
        const msg = data?.msg;

        if (response.status === 401 && authConfig.enableTokenRefresh && !requestConfig._skipAuthRefresh) {
            return refreshTokenAndRetry(requestConfig, httpRequest);
        }

        switch (code) {
            case ApiCodeEnum.ACCESS_TOKEN_INVALID:
                if (authConfig.enableTokenRefresh && !requestConfig._skipAuthRefresh) {
                    return refreshTokenAndRetry(requestConfig, httpRequest);
                }
                await redirectToLogin("登录已过期，请重新登录");
                return Promise.reject(new Error(msg || "Access Token Invalid"));

            case ApiCodeEnum.REFRESH_TOKEN_INVALID:
                await redirectToLogin("登录已过期，请重新登录");
                return Promise.reject(new Error(msg || "Refresh Token Invalid"));

            default:
                if (response.status === 403) {
                    toast.add({title: "错误", description: msg || "无权限访问当前功能", color: "error"})
                    return Promise.reject(new Error(msg || "Forbidden"));
                }

                if (code === BUSINESS_ACCESS_DENIED_CODE) {
                    toast.add({title: "错误", description: msg || "无权访问当前资源", color: "error"})
                    return Promise.reject(new Error(msg || "Business Forbidden"));
                }

                if (response.status >= 500 || code === ApiCodeEnum.ERROR) {
                    toast.add({title: "错误", description: "系统繁忙，请稍后再试", color: "error"})
                    return Promise.reject(new Error(msg || "System Error"));
                }

                toast.add({title: "错误", description: msg || "请求失败", color: "error"})
                return Promise.reject(new Error(msg || "Request Error"));
        }
    }
);

export default httpRequest;
