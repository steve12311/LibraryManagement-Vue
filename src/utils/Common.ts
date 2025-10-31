import {transformMenus, transformRoutes} from "./Convert.ts";
import {useStore} from "../store/store.ts";
import router from "../router/router.ts";
import type {RouteRecordRaw} from "vue-router";

export type Page = {
    pageNum: number,
    pageSize: number,
    total: number,
}

export type Dept = {
    createBy: string
    createTime: string
    updateBy: string | null
    updateTime: string | null
    remark: string | null
    deptId: number
    parentId: number
    ancestors: string
    deptName: string
    orderNum: number
    leader: string
    phone: string
    email: string
    status: string
    delFlag: string
    parentName: string | null
    children: Dept[]
}

export type User = {
    userId: number;
    avatar: string;
    userName: string;
    nickName: string;
    phonenumber: string;
    status: string;
    createTime: string;
    delFlag: "0" | "1",
    deptName: string;
}

export type PageInfo<T> = {
    records: T[],
    total: number,
    size: number,
    current: number,
    pages: number,
}

export type Meta = {
    title: string,
    icon: string,
    noCache: boolean,
    link: string
}

export type Router = {
    name: string,
    path: string,
    hidden: boolean,
    redirect: string,
    component: string,
    query: string,
    alwaysShow: string,
    meta: Meta,
    children: Router[],
}

export type Role = {
    roleId: number,
    roleName: string,
    roleKey: string,
    createTime: string
    status: "0" | "1",
    delFlag: "0" | "1",
}

export type Response<T> = {
    msg: string,
    code: number,
    data: T,
    token?: string,
    permissions?: string[],
    roles?: string[],
    isDefaultModifyPwd?: boolean,
    isPasswordExpired?: boolean,
    user?: User,
}

export function initRouter() {
    const store = useStore()
    const routeList = transformRoutes(store.originalRouter)
    routeList.forEach((route) => {
        router.addRoute(route)
    })
    return routeList
}

export function initMenus(routeList: RouteRecordRaw[]) {
    const store = useStore()
    store.menus = [
        {
            label: "主页",
            icon: "i-lucide-house",
            to: "/"
        },
    ]
    transformMenus(routeList).forEach((item) => {
        store.menus?.push(item)
    })
}