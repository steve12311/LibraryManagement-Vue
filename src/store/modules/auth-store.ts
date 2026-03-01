import {defineStore} from "pinia";
import {ref} from "vue";
import {pinia} from "../index.ts"

export const useAuthStore = defineStore("auth-store", () => {
    const accessToken = ref("")

    function setToken(newAccessToken: string) {
        accessToken.value = newAccessToken;
    }

    function clearAuth() {
        accessToken.value = "";
    }

    return {
        accessToken,
        setToken,
        clearAuth,
    }
}, {
    persist: {
        storage: localStorage,
    },
})

export function useAuthStoreHook() {
    return useAuthStore(pinia);
}
