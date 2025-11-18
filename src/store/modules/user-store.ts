import {defineStore} from "pinia";
import {useAuthStoreHook} from "./auth-store.ts";
import AuthAPI from "../../api/auth-api.ts";
import {pinia} from "../index.ts";
import type {LoginFormData} from "../../api/auth-api.ts"
import type {UserInfo} from "../../api/user-api.ts"
import UserAPI from "../../api/user-api.ts";
import {ref} from "vue";
import {usePermissionStoreHook} from "./permission-store.ts";

export const useUserStore = defineStore("user-store", () => {
    // 用户信息
    const userInfo = ref<UserInfo>({} as UserInfo);

    function refreshToken() {
        const refreshToken = useAuthStoreHook().refreshToken;
        if (!refreshToken) {
            return Promise.reject(new Error("没有有效的刷新令牌"));
        }
        return new Promise<void>((resolve, reject) => {
            AuthAPI.refreshToken(refreshToken)
                .then((data: any) => {
                    const {accessToken, refreshToken: newRefreshToken} = data;
                    // 更新令牌，保持当前记住我状态
                    useAuthStoreHook().setToken(accessToken, newRefreshToken);
                    resolve();
                })
                .catch((error: any) => {
                    console.log(" refreshToken  刷新失败", error);
                    reject(error);
                });
        });
    }

    /**
     * 获取用户信息
     *
     * @returns UserInfo 用户信息
     */
    function getUserInfo() {
        return new Promise<UserInfo>((resolve, reject) => {
            UserAPI.getInfo()
                .then((data) => {
                    if (!data) {
                        reject("Verification failed, please Login again.");
                        return;
                    }
                    Object.assign(userInfo.value, {...data});
                    resolve(data);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * 登录
     *
     * @returns
     * @param LoginFormData
     */
    function login(LoginFormData: LoginFormData) {
        return new Promise<void>((resolve, reject) => {
            AuthAPI.login(LoginFormData)
                .then((data) => {
                    const {accessToken, refreshToken} = data;
                    useAuthStoreHook().setToken(accessToken, refreshToken);
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    function resetAllState() {
        resetUserState();
        return Promise.resolve();
    }

    function resetUserState() {
        // 清除用户凭证
        useAuthStoreHook().clearAuth();
        // 重置路由
        usePermissionStoreHook().resetRouter();
        // 重置用户信息
        userInfo.value = {} as UserInfo;
    }

    return {
        refreshToken,
        resetAllState,
        login,
        isLogin: () => !!useAuthStoreHook().accessToken,
        getUserInfo,
        userInfo,
        resetUserState,
    }
}, {
    persist: true,
})

export function useUserStoreHook() {
    return useUserStore(pinia);
}