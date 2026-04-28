export const ApiCodeEnum = {
  SUCCESS : "00000",
  ERROR : "B0001",
  /** 访问令牌无效或过期 */
  ACCESS_TOKEN_INVALID : "A0230",
  /** 刷新令牌无效或过期 */
  REFRESH_TOKEN_INVALID :"A0231",
} as const;
