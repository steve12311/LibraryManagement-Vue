import type {App} from "vue";
import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";

export const constantRoutes: RouteRecordRaw[] = [
    {
        path: "/login", name: "Login", meta: {hidden: true}, component: () => import("../pages/Login.vue")
    },
    {
        path: "/", component: () => import("../pages/Home.vue"),
        meta: {title: "主页", hidden: false, icon: "i-lucide-house"},
        children: [
            {
                path: "",
                name: "Home",
                meta: {hidden: true},
                component: () => import("../views/Index.vue")
            }
        ]
    },
    {
        path: "/me", name: "Me", meta: {hidden: true}, component: () => import("../pages/Me.vue")
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
    scrollBehavior: () => ({left: 0, top: 0}),
})

export function setupRouter(app: App<Element>) {
    app.use(router);
}

export default router;
