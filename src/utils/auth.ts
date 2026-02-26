import {useUserStoreHook} from "@/store";
import router from "@/router";

/**
 * 重定向到登录页面
 */
export async function redirectToLogin(message: string = "请重新登录"): Promise<void> {
    const toast = useToast()
    toast.add({title: "错误", description: message, color: "error"})

    await useUserStoreHook().resetAllState();

    try {
        // 跳转到登录页，保留当前路由用于登录后跳转
        const currentPath = router.currentRoute.value.fullPath;
        await router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } catch (error) {
        console.error("Redirect to login error:", error);
        // 强制跳转，即使路由重定向失败
        window.location.href = "/login";
    }
}
