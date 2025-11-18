/**
 * 认证功能配置
 */
export const authConfig = {
    /**
     * Token自动刷新开关
     *
     * true: 启用自动刷新 - ACCESS_TOKEN_INVALID时尝试刷新token
     * false: 禁用自动刷新 - ACCESS_TOKEN_INVALID时直接跳转登录页
     *
     * 适用场景：后端没有刷新接口或不需要自动刷新的项目可设为false
     */
    enableTokenRefresh: true,
} as const;