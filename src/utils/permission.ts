import router from "../router/router";
import {useUserStore, useUserStoreHook} from "@/store";
import {usePermissionStore} from "../store/modules/permission-store.ts";
import type {RouteRecordRaw} from "vue-router";

export function setupPermission() {
    const whiteList = ["/login"];

    router.beforeEach(async (to, _) => {
        const isLogin = useUserStoreHook().isLogin()
        try {
            if (!isLogin) {
                if (whiteList.includes(to.path)) {
                    return true
                } else {
                    return {path: `/login?redirect=${encodeURIComponent(to.fullPath)}`};
                }
            }

            // 已登录登录页重定向
            if (to.path === "/login") {
                return {path: "/"};
            }

            const permissionStore = usePermissionStore();
            const userStore = useUserStore();

            if (!permissionStore.isRouteGenerated) {
                if (!userStore.userInfo?.roles?.length) {
                    await userStore.getUserInfo();
                }

                const dynamicRoutes = await permissionStore.generateRoutes();
                dynamicRoutes.forEach((route: RouteRecordRaw) => {
                    router.addRoute(route);
                });

                return {...to, replace: true};
            }
        } catch (e) {
            console.error("Route guard error:", e);
            await useUserStore().resetAllState();
            return {path: "/login"}
        }
    })
}