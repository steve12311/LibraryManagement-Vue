import type {Router} from "./Common.ts";
import type {RouteRecordRaw} from "vue-router";
import type {NavigationMenuItem} from "@nuxt/ui";

const componentMap: any = {
    'pages/Home.vue': () => import('../pages/Home.vue'),
    "pages/Library.vue": () => import("../pages/Home.vue"),
    'view/SysUser.vue': () => import('../views/SysUser.vue'),
    'view/SysRole.vue': () => import('../views/SysRole.vue'),
    'view/SysDept.vue': () => import('../views/SysDept.vue'),
    "view/SysMenu.vue": () => import('../views/SysMenu.vue'),
    "view/LibStock.vue": () => import('../views/LibStock.vue'),
    "view/LibBorrow.vue": () => import('../views/LibBorrow.vue'),
    "view/LibPublish.vue": () => import('../views/LibPublish.vue'),
    "view/LibCategory.vue": () => import('../views/LibCategory.vue'),
    // 添加其他组件...
};

function transformRoutes(backendRoutes: Router[]): RouteRecordRaw[] {
    if (!Array.isArray(backendRoutes)) {
        return [];
    }

    return backendRoutes.map(route => {
        const transformedRoute: any = {
            path: route.path,
            name: route.name,
            meta: {
                icon: route.meta?.icon || "",
                title: route.meta?.title || '',
                isRouter: !route.alwaysShow && !route.children?.length
            }
        };

        // 处理component，转换为动态导入
        if (route.component && componentMap[route.component]) {
            transformedRoute.component = componentMap[route.component];
        }

        // 递归处理子路由
        if (route.children && Array.isArray(route.children) && route.children.length > 0) {
            transformedRoute.children = transformRoutes(route.children);
        }

        return transformedRoute;
    });
}

function transformMenus(transformedRoutes: RouteRecordRaw[], path: string | undefined = undefined): NavigationMenuItem[] {
    if (!Array.isArray(transformedRoutes)) {
        return [];
    }
    return transformedRoutes.map(route => {
        const transformedMenu: NavigationMenuItem = {
            label: route.meta?.title as string || '',
            icon: route.meta?.icon || "",
        }
        if (route.meta?.isRouter) {
            transformedMenu.to = path ? path + "/" + route.path : route.path;
        }
        if (route.children && Array.isArray(route.children) && route.children.length > 0) {
            transformedMenu.children = transformMenus(route.children, route.path);
        }
        return transformedMenu;
    })
}

export {transformRoutes, transformMenus};