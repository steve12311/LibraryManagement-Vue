import {defineStore} from "pinia";
import {ref} from "vue";
import type {RouteRecordRaw} from "vue-router";
import MenuAPI, {type RouteVO} from "../../api/system/menu-api.ts";
import router, {constantRoutes} from "../../router";
import {pinia} from "../index.ts";

const modules = import.meta.glob("../../views/**/**.vue");
const Layout = () => import("../../pages/Home.vue");

export const usePermissionStore = defineStore('permission-store', () => {
    const isRouteGenerated = ref(false);
    const routes = ref<RouteRecordRaw[]>([])

    /** 从后端拉取菜单路由，转换为 Vue Router 配置并注册 */
    async function generateRoutes(): Promise<RouteRecordRaw[]> {
        try {
            const data = await MenuAPI.getRoutes();
            const dynamicRoutes = transformRoutes(data);

            routes.value = [...constantRoutes, ...dynamicRoutes];
            isRouteGenerated.value = true;

            return dynamicRoutes;
        } catch (error) {
            isRouteGenerated.value = false;
            throw error;
        }
    }

    /** 移除所有动态注册的路由，恢复为仅静态路由 */
    function resetRouter() {
        const constantRouteNames = new Set(constantRoutes.map((route) => route.name).filter(Boolean));
        routes.value.forEach((route) => {
            if (route.name && !constantRouteNames.has(route.name)) {
                router.removeRoute(route.name);
            }
        });

        routes.value = [...constantRoutes];
        isRouteGenerated.value = false;
    }

    return {
        isRouteGenerated,
        generateRoutes,
        routes,
        resetRouter,
    }
})

/**
 * 将后端 RouteVO 转换为 Vue Router 的 RouteRecordRaw 格式。
 * 转换规则：
 * - 顶层路由：直接映射组件路径
 * - 中间层 Layout：设为 undefined（只做容器，不渲染组件）
 * - 子路由：递归转换
 * - 组件路径通过 import.meta.glob 动态懒加载，找不到时 fallback 到 404
 */
const transformRoutes = (routes: RouteVO[], isTopLevel: boolean = true): RouteRecordRaw[] => {
    return routes.map((route) => {
        const {component, children, ...args} = route;

        // 顶层或非 Layout 保留组件；中间层 Layout 去掉组件渲染
        const processedComponent = isTopLevel || component !== "Layout" ? component : undefined;

        const normalizedRoute = {...args} as RouteRecordRaw;

        if (!processedComponent) {
            normalizedRoute.component = undefined;
        } else {
            // Layout 单独懒加载，其余从 glob 匹配
            normalizedRoute.component =
                processedComponent === "Layout"
                    ? Layout
                    : modules[`../../views/${processedComponent}.vue`] ||
                    modules[`../../views/error/404.vue`];
        }

        if (children && children.length > 0) {
            normalizedRoute.children = transformRoutes(children, false);
        }

        return normalizedRoute;
    });
};

export function usePermissionStoreHook() {
    return usePermissionStore(pinia);
}
