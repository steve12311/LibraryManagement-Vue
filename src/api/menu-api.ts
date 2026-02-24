import request from "@/utils/request";
import {MenuTypeEnum} from "@/enums/system/menu-enum";
import type {NavigationMenuItem} from "@nuxt/ui";
import {usePermissionStoreHook} from "@/store/modules/permission-store.ts";
import {computed} from "vue";
import type {RouteRecordRaw} from "vue-router";

const MENU_BASE_URL = "/api/v1/menus";

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
        const routes = computed(() => usePermissionStoreHook().routes);
        const menuItems: NavigationMenuItem[] = []
        routes.value.forEach((item) => {
            const meta = item.meta || {}
            if (meta.hidden) {
                return;
            }
            // 构建基础菜单项
            const menuItem: NavigationMenuItem = {
                label: meta.title as string || meta.label as string || item.name?.toString() || item.path,
                to: item.path,
                icon: meta.icon as string,
                defaultOpen: meta.alwaysShow as boolean || false,
            };

            // 递归处理子路由
            if (item.children && item.children.length > 0) {
                const childMenuItems = transformChildRoutes(item.children, item.path);
                if (childMenuItems.length > 0) {
                    menuItem.children = childMenuItems;
                    // 如果有子菜单且未指定类型，自动设置为 trigger
                    if (!meta.type && menuItem.children.length > 0) {
                        menuItem.type = 'trigger';
                    }
                }
            }
            menuItems.push(menuItem)
        })
        return menuItems;
    },
    /** 获取菜单下拉数据源 */
    getOptions(onlyParent?: boolean) {
        return request<any, OptionType[]>({
            url: `${MENU_BASE_URL}/options`,
            method: "get",
            params: {onlyParent},
        });
    },
    /** 获取菜单表单数据 */
    getFormData(id: number) {
        return request<any, MenuForm>({url: `${MENU_BASE_URL}/${id}/form`, method: "get"});
    },

    /** 新增菜单 */
    create(data: MenuForm) {
        return request({url: `${MENU_BASE_URL}`, method: "post", data});
    },

    /** 修改菜单 */
    update(id: number, data: MenuForm) {
        return request({url: `${MENU_BASE_URL}/${id}`, method: "put", data});
    },
    delete(deleteIds: number[]) {
        // 将数组转为字符串，以逗号分隔
        const deleteIdsStr = deleteIds.join(",");
        return request({url: `${MENU_BASE_URL}/${deleteIdsStr}`, method: "delete"});
    }
}

// 辅助方法：处理子路由转换
function transformChildRoutes(childRoutes: RouteRecordRaw[], parentPath: string = ''): NavigationMenuItem[] {
    const childMenuItems: NavigationMenuItem[] = [];

    childRoutes.forEach((child) => {
        const childMeta = child.meta || {};
        if (childMeta.hidden) {
            return;
        }

        const fullPath = parentPath ? `${parentPath}/${child.path}` : child.path;

        const childMenuItem: NavigationMenuItem = {
            label: childMeta.title as string || childMeta.label as string || child.name?.toString() || child.path,
            to: fullPath,
            icon: childMeta.icon as string,
            defaultOpen: childMeta.alwaysShow as boolean || false,
        };

        // 递归处理孙子路由
        if (child.children && child.children.length > 0) {
            const grandChildItems = transformChildRoutes(child.children, fullPath);
            if (grandChildItems.length > 0) {
                childMenuItem.children = grandChildItems;
                if (!childMeta.type && childMenuItem.children.length > 0) {
                    childMenuItem.type = 'trigger';
                }
            }
        }

        childMenuItems.push(childMenuItem);
    });

    return childMenuItems;
}

export interface MenuVO {
    /** 子菜单 */
    children?: MenuVO[];
    /** 组件路径 */
    component?: string;
    /** ICON */
    icon?: string;
    /** 菜单ID */
    id?: number;
    /** 菜单名称 */
    name?: string;
    /** 父菜单ID */
    parentId?: number;
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
    type?: typeof MenuTypeEnum[keyof typeof MenuTypeEnum];
    /** 是否可见(1:显示;0:隐藏) */
    visible?: number;
}

export interface RouteVO {
    /** 子路由列表 */
    children: RouteVO[];
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
}

export interface PermitForm {
    id?: number;
    label?: string;
    parentId?: number;
    value?: string;
}

export interface MenuForm {
    /** 菜单ID */
    id?: number;
    /** 父菜单ID */
    parentId?: number;
    /** 菜单名称 */
    name?: string;
    /** 是否可见(1-是 0-否) */
    visible: number;
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
    type?: typeof MenuTypeEnum[keyof typeof MenuTypeEnum];
    /** 权限标识 */
    perm?: string;
    /** 【菜单】是否开启页面缓存 */
    keepAlive?: number;
    /** 【目录】只有一个子路由是否始终显示 */
    alwaysShow?: number;
    /** 权限列表*/
    perms: PermitForm[];
    /** 其他参数 */
    params?: any[];
}

export default MenuAPI;