import request from "@/utils/request";
import type {SelectMenuItem} from "@nuxt/ui";

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
    getOptions() {
        return request<any, SelectMenuItem[]>({
            url: `${USER_BASE_URL}/options`,
            method: "get",
        })
    },
    changeStatus(id: string, status: number) {
        return request({
            url: `${USER_BASE_URL}/${id}/status`,
            method: "put",
            params: {
                status,
            },
        })
    },
    getFormData(id: string) {
        return request<any, UserForm>({
            url: `${USER_BASE_URL}/${id}/form`,
            method: "get",
        })
    },
    /*如果不填重置的密码则后端默认会为123456*/
    resetPassword(id: string, password?: string) {
        return request({
            url: `${USER_BASE_URL}/${id}/password/reset`,
            method: "put",
            params: {
                password,
            }
        })
    },
    /*更改自己的密码*/
    editPassword(data: PasswordUpdateForm) {
        return request({
            url: `${USER_BASE_URL}/password`,
            method: "put",
            data: data,
        })
    },
    getProfile() {
        return request<any, UserProfile>({
            url: `${USER_BASE_URL}/profile`,
            method: "get",
        })
    },
    updateProfile(data: UserProfileForm) {
        return request({
            url: `${USER_BASE_URL}/profile`,
            method: "put",
            data: data,
        })
    },
    create(data: UserForm) {
        return request({
            url: `${USER_BASE_URL}`,
            method: "post",
            data: data,
        })
    },
    update(id: string, data: UserForm) {
        return request({
            url: `${USER_BASE_URL}/${id}`,
            method: "put",
            data: data,
        })
    },
    delete(ids: string[]) {
        const idsStr = ids.join(",");
        return request({
            url: `${USER_BASE_URL}/${idsStr}`,
            method: "delete",
        })
    }
}

export interface UserProfileForm {
    id: number;

    username: string;

    nickname: string;

    avatar: string;

    gender: number;

    mobile: string;

    email: string;
}

export interface UserProfile {
    id: number;

    username: string;

    nickname: string;

    avatar: string;

    gender: number;

    mobile: string;

    email: string;

    roleNames: string;

    createTime: Date;
}

export interface PasswordUpdateForm {
    oldPassword: string;

    newPassword: string;

    confirmPassword: string;
}

export interface UserForm {
    id: number;

    username: string;

    nickname: string;

    mobile: string;

    gender: number;

    avatar: string;

    email: string;

    status: number;

    deptId: number;

    roleIds: number[];

    openId: string;
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