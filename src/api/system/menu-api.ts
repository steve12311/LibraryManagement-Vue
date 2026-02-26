import request from "@/utils/request";
import {MenuTypeEnum} from "@/enums/system/menu-enum";
import type {NavigationMenuItem} from "@nuxt/ui";
import {usePermissionStoreHook} from "@/store/modules/permission-store.ts";
import type {RouteRecordRaw} from "vue-router";

const MENU_BASE_URL = "/api/v1/menus";
export type MenuId = number;
export type MenuVisible = 0 | 1;
export type MenuSwitch = 0 | 1;
export type MenuType = typeof MenuTypeEnum[keyof typeof MenuTypeEnum];

const MenuAPI = {
    /** 获取当前用户的路由列表 */
    getRoutes() {
        return request<any, RouteVO[]>({url: `${MENU_BASE_URL}/routes`, method: "get"});
    },
    /** 获取菜单树形列表 */
    getList(queryParams: MenuQuery) {
        return request<any, MenuVO[]>({url: `${MENU_BASE_URL}`, method: "get", params: queryParams});
    },
    getMenus(): NavigationMenuItem[] {
        return transformRoutesToMenus(usePermissionStoreHook().routes);
    },
    /** 获取菜单下拉数据源 */
    getOptions(onlyParent?: boolean) {
        return request<any, OptionType[]>({
            url: `${MENU_BASE_URL}/options`,
            method: "get",
            params: onlyParent === undefined ? undefined : {onlyParent},
        });
    },
    /** 获取菜单表单数据 */
    getFormData(id: MenuId) {
        return request<any, MenuForm>({url: `${MENU_BASE_URL}/${id}/form`, method: "get"});
    },

    /** 新增菜单 */
    create(data: MenuForm) {
        return request({url: `${MENU_BASE_URL}`, method: "post", data});
    },

    /** 修改菜单 */
    update(id: MenuId, data: MenuForm) {
        return request({url: `${MENU_BASE_URL}/${id}`, method: "put", data});
    },
    delete(deleteIds: MenuId[] | MenuId) {
        // 将数组转为字符串，以逗号分隔
        const deleteIdsStr = Array.isArray(deleteIds) ? deleteIds.join(",") : String(deleteIds);
        return request({url: `${MENU_BASE_URL}/${deleteIdsStr}`, method: "delete"});
    }
}

function joinRoutePath(parentPath: string, currentPath: string) {
    if (!currentPath) return parentPath || "/";
    if (currentPath.startsWith("/")) return currentPath;
    const normalizedParent = parentPath.endsWith("/") ? parentPath.slice(0, -1) : parentPath;
    return normalizedParent ? `${normalizedParent}/${currentPath}` : `/${currentPath}`;
}

function transformRoutesToMenus(routes: RouteRecordRaw[], parentPath: string = ""): NavigationMenuItem[] {
    return routes.reduce<NavigationMenuItem[]>((menus, route) => {
        const meta = route.meta || {};
        if (meta.hidden) return menus;

        const fullPath = joinRoutePath(parentPath, route.path || "");
        const menuItem: NavigationMenuItem = {
            label: (meta.title as string) || (meta.label as string) || route.name?.toString() || route.path || fullPath,
            to: fullPath,
            icon: meta.icon as string,
            defaultOpen: (meta.alwaysShow as boolean) || false,
        };

        if (route.children?.length) {
            const children = transformRoutesToMenus(route.children, fullPath);
            if (children.length > 0) {
                menuItem.children = children;
                if (!meta.type) {
                    menuItem.type = "trigger";
                }
            }
        }

        menus.push(menuItem);
        return menus;
    }, []);
}

export interface MenuVO {
    /** 子菜单 */
    children?: MenuVO[];
    /** 组件路径 */
    component?: string;
    /** ICON */
    icon?: string;
    /** 菜单ID */
    id?: MenuId;
    /** 菜单名称 */
    name?: string;
    /** 父菜单ID */
    parentId?: MenuId;
    /** 按钮权限标识 */
    perm?: string;
    /** 跳转路径 */
    redirect?: string;
    /** 路由名称 */
    routeName?: string;
    /** 路由相对路径 */
    routePath?: string;
    /** 菜单排序(数字越小排名越靠前) */
    sort?: number;
    /** 菜单类型 */
    type?: MenuType;
    /** 是否可见(1:显示;0:隐藏) */
    visible?: MenuVisible;
}

export interface RouteVO {
    /** 子路由列表 */
    children?: RouteVO[];
    /** 组件路径 */
    component?: string;
    /** 路由属性 */
    meta?: Meta;
    /** 路由名称 */
    name?: string;
    /** 路由路径 */
    path?: string;
    /** 跳转链接 */
    redirect?: string;
}

export interface MenuQuery {
    /** 搜索关键字 */
    keywords?: string;
    /** 状态(1:显示;0:隐藏) */
    status?: MenuVisible;
}

export interface Meta {
    /** 【目录】只有一个子路由是否始终显示 */
    alwaysShow?: boolean;
    /** 是否隐藏(true-是 false-否) */
    hidden?: boolean;
    /** ICON */
    icon?: string;
    /** 【菜单】是否开启页面缓存 */
    keepAlive?: boolean;
    /** 路由title */
    title?: string;
    /** 其他参数 */
    params?: Record<string, string>;
}

export interface PermitForm {
    id?: MenuId;
    label?: string;
    parentId?: MenuId;
    value?: string;
}

export interface MenuForm {
    /** 菜单ID */
    id?: MenuId;
    /** 父菜单ID */
    parentId?: MenuId;
    /** 菜单名称 */
    name?: string;
    /** 是否可见(1-是 0-否) */
    visible: MenuVisible;
    /** ICON */
    icon?: string;
    /** 排序 */
    sort?: number;
    /** 路由名称 */
    routeName?: string;
    /** 路由路径 */
    routePath?: string;
    /** 组件路径 */
    component?: string;
    /** 跳转路由路径 */
    redirect?: string;
    /** 菜单类型 */
    type?: MenuType;
    /** 权限标识 */
    perm?: string;
    /** 【菜单】是否开启页面缓存 */
    keepAlive?: MenuSwitch;
    /** 【目录】只有一个子路由是否始终显示 */
    alwaysShow?: MenuSwitch;
    /** 权限列表*/
    perms?: PermitForm[];
    /** 其他参数 */
    params?: Array<{ key: string; value: string }>;
}

export default MenuAPI;
