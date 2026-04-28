import request from "@/utils/request"

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
    refreshToken() {
        return request<unknown, LoginResult>({
            url: `${AUTH_BASE_URL}/refresh-token`,
            method: "post",
            headers: {
                Authorization: "no-auth",
            },
            withCredentials: true,
        });
    },
    getCaptcha() {
        return request<unknown, CaptchaInfo>({
            url: `${AUTH_BASE_URL}/captcha`,
            method: "get",
            headers: {
                Authorization: "no-auth",
            },
        });
    },
    login(data: LoginFormData) {
        const body = new URLSearchParams({
            username: String(data.username ?? ""),
            password: String(data.password ?? ""),
            captchaCode: String(data.captchaCode ?? ""),
            captchaKey: String(data.captchaKey ?? ""),
        });
        return request<unknown, LoginResult>({
            url: `${AUTH_BASE_URL}/login`,
            method: "post",
            data: body.toString(),
            headers: {
                Authorization: "no-auth",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
        });
    },
    logout() {
        return request({
            url: `${AUTH_BASE_URL}/logout`,
            method: "delete",
            withCredentials: true,
        });
    }
};

export interface LoginFormData {
    username: string;
    password: string;
    captchaKey: string;
    captchaCode: string;
}

export interface LoginResult {
    accessToken: string;
    tokenType: string;
    /** 过期时间(秒) */
    expiresIn: number;
}

export interface CaptchaInfo {
    captchaKey: string;
    /** 验证码图片 Base64 */
    captchaBase64: string;
}

export default AuthAPI;
