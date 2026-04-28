import type {RouteRecordRaw} from "vue-router";
import router from "@/router";
import {usePermissionStore} from "@/store/modules/permission-store";
import {useUserStore, useUserStoreHook} from "@/store";

/**
 * 注册全局导航守卫。
 * 守卫流程：
 * 1. 未登录 → 白名单放行，其余跳转 /login（携带 redirect 参数）
 * 2. 已登录访问 /login → 重定向到 /
 * 3. 已登录且首次进入 → 获取用户信息 → 拉取动态路由 → addRoute 注册 → 重放当前导航
 */
export function setupPermission() {
    const whiteList = ["/login"];

    router.beforeEach(async (to) => {
        const isLogin = useUserStoreHook().isLogin()
        try {
            // 未登录：白名单放行，其余跳登录
            if (!isLogin) {
                if (whiteList.includes(to.path)) {
                    return true
                } else {
                    return {path: `/login?redirect=${encodeURIComponent(to.fullPath)}`};
                }
            }

            // 已登录访问登录页 → 重定向首页
            if (to.path === "/login") {
                return {path: "/"};
            }

            const permissionStore = usePermissionStore();
            const userStore = useUserStore();

            // 首次进入：拉取用户信息 + 动态路由
            if (!permissionStore.isRouteGenerated) {
                if (!userStore.userInfo?.roles?.length) {
                    await userStore.getUserInfo();
                }

                const dynamicRoutes = await permissionStore.generateRoutes();
                dynamicRoutes.forEach((route: RouteRecordRaw) => {
                    router.addRoute(route);
                });

                // 重放当前导航以匹配新注册的路由
                return {...to, replace: true};
            }
        } catch (e) {
            console.error("Route guard error:", e);
            await useUserStore().resetAllState();
            return {path: "/login"}
        }
    })
}
