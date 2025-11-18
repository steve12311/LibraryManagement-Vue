import request from "../utils/request";

const USER_BASE_URL = "/api/v1/users";

const UserAPI = {
    /**
     * 获取当前登录用户信息
     *
     * @returns 登录用户昵称、头像信息，包括角色和权限
     */
    getInfo() {
        return request<any, UserInfo>({
            url: `${USER_BASE_URL}/me`,
            method: "get",
        });
    },
    /**
     * 获取用户分页列表
     *
     * @param queryParams 查询参数
     */
    getPage(queryParams: UserPageQuery) {
        return request<any, PageResult<UserPageVO[]>>({
            url: `${USER_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        });
    },
}

/** 用户分页对象 */
export interface UserPageVO {
    /** 用户ID */
    id: string;
    /** 用户头像URL */
    avatar?: string;
    /** 创建时间 */
    createTime?: Date;
    /** 部门名称 */
    deptName?: string;
    /** 用户邮箱 */
    email?: string;
    /** 性别 */
    gender?: number;
    /** 手机号 */
    mobile?: string;
    /** 用户昵称 */
    nickname?: string;
    /** 角色名称，多个使用英文逗号(,)分割 */
    roleNames?: string;
    /** 用户状态(1:启用;0:禁用) */
    status?: number;
    /** 用户名 */
    username?: string;
}

/**
 * 用户分页查询对象
 */
export interface UserPageQuery extends PageQuery {
    /** 搜索关键字 */
    keywords?: string;

    /** 用户状态 */
    status?: number;

    /** 部门ID */
    deptId?: string;

    /** 开始时间 */
    createTime?: [string, string];
}

/** 登录用户信息 */
export interface UserInfo {
    /** 用户ID */
    userId?: string;

    /** 用户名 */
    username?: string;

    /** 昵称 */
    nickname?: string;

    /** 头像URL */
    avatar?: string;

    /** 角色 */
    roles: string[];

    /** 权限 */
    perms: string[];
}

export default UserAPI;