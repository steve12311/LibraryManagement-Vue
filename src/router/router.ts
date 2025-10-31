import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";
import {useStore} from "../store/store.ts";
import type {Router, Response} from "../utils/Common.ts"

const routes: RouteRecordRaw[] = [
    {
        path: "/login", name: "Login", component: () => import("../pages/Login.vue")
    },
    {
        path: "/", component: () => import("../pages/Home.vue"),
        meta: {title: "主页", isRouter: true},
        children: [
            {
                path: "",
                name: "Home",
                component: () => import("../view/Index.vue")
            }
        ]
    },
    {
        path: "/:pathMatch(.*)*",
        component: () => import("../components/HelloWorld.vue"),
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

router.beforeEach(async (to, from) => {
    const store = useStore()
    if (store.token) {
        const {get} = await import("../api/request.ts")
        const {data: addRoute} = await get<Response<Router[]>>("/routers")
        store.originalRouter = addRoute.data
    }
    if (!store.token && to.name !== "Login") {
        return {name: "Login"};
    }
    if (store.token && to.name === "Login") {
        return {name: from.name};
    }
    return true
})

export default router;