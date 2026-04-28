import {defineStore} from "pinia";
import {useAuthStoreHook} from "./auth-store";
import AuthAPI, { type LoginFormData } from "@/api/system/auth-api";
import {pinia} from "../index";
import type {UserInfo} from "@/api/system/user-api";
import UserAPI from "@/api/system/user-api";
import {ref} from "vue";
import {usePermissionStoreHook} from "./permission-store";

export const useUserStore = defineStore("user-store", () => {
    const userInfo = ref<UserInfo>({} as UserInfo);

    async function refreshToken(): Promise<void> {
        try {
            const {accessToken} = await AuthAPI.refreshToken();
            useAuthStoreHook().setToken(accessToken);
        } catch (error) {
            console.error("refreshToken 刷新失败", error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     *
     * @returns UserInfo 用户信息
     */
    async function getUserInfo(): Promise<UserInfo> {
        const data = await UserAPI.getInfo();
        if (!data) {
            throw new Error("获取用户信息失败，请重新登录");
        }
        userInfo.value = {...data};
        return data;
    }

    /**
     * 登录
     */
    async function login(loginFormData: LoginFormData): Promise<void> {
        const {accessToken} = await AuthAPI.login(loginFormData);
        useAuthStoreHook().setToken(accessToken);
    }

    async function resetAllState(): Promise<void> {
        resetUserState();
    }

    function resetUserState() {
        useAuthStoreHook().clearAuth();
        usePermissionStoreHook().resetRouter();
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
});

export function useUserStoreHook() {
    return useUserStore(pinia);
}
