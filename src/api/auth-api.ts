import request from "../utils/request.ts"

const AUTH_BASE_URL = "/api/v1/auth";

const AuthAPI = {
    /** 刷新 token 接口*/
    refreshToken(refreshToken: string) {
        return request<any, LoginResult>({
            url: `${AUTH_BASE_URL}/refresh-token`,
            method: "post",
            params: {refreshToken},
            headers: {
                Authorization: "no-auth",
            },
        });
    },
    /** 获取验证码接口*/
    getCaptcha() {
        return request<any, CaptchaInfo>({
            url: `${AUTH_BASE_URL}/captcha`,
            method: "get",
        });
    },
    /** 登录接口*/
    login(data: LoginFormData) {
        return request<any, LoginResult>({
            url: `${AUTH_BASE_URL}/login`,
            method: "post",
            data,
            headers: {
                "Content-Type": "application/json",
            },
        });
    },
}

/** 登录表单数据 */
export interface LoginFormData {
    /** 用户名 */
    username: string;
    /** 密码 */
    password: string;
    /** 验证码缓存key */
    captchaKey: string;
    /** 验证码 */
    captchaCode: string;
}

/** 登录响应 */
export interface LoginResult {
    /** 访问令牌 */
    accessToken: string;
    /** 刷新令牌 */
    refreshToken: string;
    /** 令牌类型 */
    tokenType: string;
    /** 过期时间(秒) */
    expiresIn: number;
}

/** 验证码信息 */
export interface CaptchaInfo {
    /** 验证码缓存key */
    captchaKey: string;
    /** 验证码图片Base64字符串 */
    captchaBase64: string;
}

export default AuthAPI;