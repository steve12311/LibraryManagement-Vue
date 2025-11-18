import {createPinia, defineStore} from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import {ref} from "vue";
import type {Router, User} from "../utils/Common.ts";
import type {NavigationMenuItem} from "@nuxt/ui";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const useStore = defineStore("main", () => {
    const accessToken = ref("")
    const refreshToken = ref("")
    const token = ref("")
    const originalRouter = ref<Router[]>([])
    const menus = ref<NavigationMenuItem[]>()
    const user = ref<User>()
    const permissions = ref<string[]>()
    const isDefaultModifyPwd = ref<boolean>()
    const isPasswordExpired = ref<boolean>()

    return {
        token,
        originalRouter,
        menus,
        user,
        permissions,
        isDefaultModifyPwd,
        isPasswordExpired,
        accessToken,
        refreshToken,
    }
}, {
    persist: true,
})

export {
    useStore,
    pinia,
}