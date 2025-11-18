import qs from "qs";
import axios, {type AxiosResponse, type InternalAxiosRequestConfig} from "axios";
import {ApiCodeEnum} from "../enums/api/code-enum.ts";
import {authConfig} from "../setting.ts";
import {useTokenRefresh} from "./useTokenRefresh.ts";
import {useAuthStoreHook} from "../store";
import {redirectToLogin} from "./auth.ts";

const {refreshTokenAndRetry} = useTokenRefresh()

/**
 * 创建 HTTP 请求实例
 */
const httpRequest = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 50000,
    headers: {"Content-Type": "application/json;charset=utf-8"},
    paramsSerializer: (params) => qs.stringify(params),
});

/**
 * 请求拦截器 - 添加 Authorization 头
 */
httpRequest.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = useAuthStoreHook().accessToken;

        // 如果 Authorization 设置为 no-auth，则不携带 Token
        if (config.headers.Authorization !== "no-auth" && accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
    }
);
/**
 * 响应拦截器 - 统一处理响应和错误
 */
httpRequest.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        const toast = useToast()
        // 如果响应是二进制数据，则直接返回response对象（用于文件下载、Excel导出、图片显示等）
        if (response.config.responseType === "blob" || response.config.responseType === "arraybuffer") {
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
    },
    async (error) => {
        const toast = useToast()
        console.error("Response interceptor error:", error);

        const {config, response} = error;

        // 网络错误或服务器无响应
        if (!response) {
            toast.add({title: "错误", description: "网络连接失败，请检查网络设置", color: "error"})
            return Promise.reject(error);
        }

        const {code, msg} = response.data as ApiResponse;

        switch (code) {
            case ApiCodeEnum.ACCESS_TOKEN_INVALID:
                // Access Token 过期
                if (authConfig.enableTokenRefresh) {
                    // 启用了token刷新，尝试刷新
                    return refreshTokenAndRetry(config, httpRequest);
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