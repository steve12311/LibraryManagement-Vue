import {defineStore} from "pinia";
import {ref} from "vue";
import {pinia} from "../index.ts"

export const useAuthStore = defineStore("auth-store", () => {
    const accessToken = ref("")
    const refreshToken = ref("")

    function setToken(newAccessToken: string, newRefreshToken: string) {
        accessToken.value = newAccessToken;
        refreshToken.value = newRefreshToken;
    }

    function clearAuth() {
        accessToken.value = "";
        refreshToken.value = "";
    }

    return {
        accessToken,
        refreshToken,
        setToken,
        clearAuth,
    }
}, {
    persist: {
        storage: sessionStorage,
    },
})

export function useAuthStoreHook() {
    return useAuthStore(pinia);
}
