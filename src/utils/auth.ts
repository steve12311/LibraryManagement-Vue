import {useUserStoreHook} from "@/store";
import router from "@/router";

/**
 * 清除登录态并跳转到登录页，当前路由会作为 redirect 参数带回以便登录后恢复。
 * 若路由跳转失败则兜底使用 window.location 强制跳转。
 */
export async function redirectToLogin(message: string = "请重新登录"): Promise<void> {
    const toast = useToast()
    toast.add({title: "错误", description: message, color: "error"})

    await useUserStoreHook().resetAllState();

    try {
        const currentPath = router.currentRoute.value.fullPath;
        await router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } catch (error) {
        console.error("Redirect to login error:", error);
        window.location.href = "/login";
    }
}
