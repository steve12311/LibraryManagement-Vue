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
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes
})

export default router;