import type { AxiosResponse } from "axios";
import request from "@/utils/request";
import type {SelectMenuItem} from "@nuxt/ui";
import type { BorrowStatusValue } from "@/enums/system/borrow-status-enum";

const USER_BASE_URL = "/api/v1/users";
export type UserId = number | string;
export type UserGender = 0 | 1 | 2;
export type UserDateValue = string | Date;

function resolveDownloadFileName(contentDisposition?: string, fallbackName = "下载文件.xlsx") {
    if (!contentDisposition) {
        return fallbackName;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (plainMatch?.[1]) {
        return decodeURIComponent(plainMatch[1]);
    }

    return fallbackName;
}

function triggerBlobDownload(response: AxiosResponse<Blob>, fallbackName: string) {
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    const urlObject = window.URL.createObjectURL(blob);
    const contentDisposition = response.headers["content-disposition"] as string | undefined;

    link.href = urlObject;
    link.download = resolveDownloadFileName(contentDisposition, fallbackName);
    link.click();

    window.URL.revokeObjectURL(urlObject);
}

const UserAPI = {
    /**
     * 获取当前登录用户信息
     *
     * @returns 登录用户昵称、头像信息，包括角色和权限
     */
    getInfo() {
        return request<unknown, UserInfo>({
            url: `${USER_BASE_URL}/me`,
            method: "get",
        });
    },
    /**
     * 获取用户分页列表
     *
     * @param queryParams 查询参数
     */
    getPage(queryParams?: UserPageQuery) {
        return request<unknown, PageResult<UserPageVO[]>>({
            url: `${USER_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        });
    },
    getOptions() {
        return request<unknown, SelectMenuItem[]>({
            url: `${USER_BASE_URL}/options`,
            method: "get",
        });
    },
    downloadTemplate() {
        return request<unknown, AxiosResponse<Blob>>({
            url: `${USER_BASE_URL}/template`,
            method: "get",
            responseType: "blob",
        }).then((response) => {
            triggerBlobDownload(response as AxiosResponse<Blob>, "用户导入模板.xlsx");
        });
    },
    importUsers(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return request<unknown, UserImportResultVO, FormData>({
            url: `${USER_BASE_URL}/import`,
            method: "post",
            data: formData,
            headers: {"Content-Type": "multipart/form-data"},
        });
    },
    exportUsers(queryParams?: UserPageQuery) {
        return request<unknown, AxiosResponse<Blob>>({
            url: `${USER_BASE_URL}/export`,
            method: "get",
            params: queryParams,
            responseType: "blob",
        }).then((response) => {
            triggerBlobDownload(response as AxiosResponse<Blob>, "用户列表.xlsx");
        });
    },
    changeStatus(userId: UserId, status: UserPageStatus) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}/${userId}/status`,
            method: "put",
            params: {
                status,
            },
        });
    },
    getFormData(userId: UserId) {
        return request<unknown, UserForm>({
            url: `${USER_BASE_URL}/${userId}/form`,
            method: "get",
        });
    },
    /*如果不填重置的密码则后端默认会为123456*/
    resetPassword(userId: UserId, password?: string) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}/${userId}/password/reset`,
            method: "put",
            params: password ? {password} : undefined,
        });
    },
    /*更改自己的密码*/
    editPassword(data: PasswordUpdateForm) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}/password`,
            method: "put",
            data: data,
        });
    },
    getProfile() {
        return request<unknown, UserProfile>({
            url: `${USER_BASE_URL}/profile`,
            method: "get",
        });
    },
    getMyBorrowPage(queryParams?: MyBorrowPageQuery) {
        return request<unknown, PageResult<MyBorrowPageVO[]>>({
            url: `${USER_BASE_URL}/me/borrows/page`,
            method: "get",
            params: queryParams,
        });
    },
    updateProfile(data: UserProfileForm) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}/profile`,
            method: "put",
            data: data,
        });
    },
    create(data: UserForm) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}`,
            method: "post",
            data: data,
        });
    },
    update(userId: UserId, data: UserForm) {
        return request<unknown, string>({
            url: `${USER_BASE_URL}/${userId}`,
            method: "put",
            data: data,
        });
    },
    delete(ids: UserId[] | UserId) {
        const idsStr = Array.isArray(ids) ? ids.join(",") : String(ids);
        return request<unknown, string>({
            url: `${USER_BASE_URL}/${idsStr}`,
            method: "delete",
        });
    }
};

export interface UserProfileForm {
    id?: UserId;

    username?: string;

    nickname: string;

    avatar?: string;

    gender?: UserGender;

    mobile?: string;

    email?: string;
}

export interface UserProfile {
    id: UserId;

    username: string;

    nickname: string;

    avatar: string;

    gender: UserGender;

    mobile: string;

    email: string;

    roleNames: string;

    createTime: UserDateValue;
}

export type MyBorrowPageStatus = BorrowStatusValue;

export interface MyBorrowPageVO {
    borrowId: string;

    isbn: string;

    cover?: string;

    bookName: string;

    returnTime: UserDateValue;

    status: MyBorrowPageStatus;
}

export interface MyBorrowPageQuery extends PageQuery {
    status?: MyBorrowPageStatus;
}

export interface PasswordUpdateForm {
    oldPassword: string;

    newPassword: string;

    confirmPassword: string;
}

export interface UserImportResultVO {
    totalCount: number;

    successCount: number;

    failureCount: number;

    messages: string[];
}

export interface UserForm {
    id?: UserId;

    username: string;

    nickname: string;

    mobile: string;

    gender: UserGender;

    avatar: string;

    email: string;

    status: UserPageStatus;

    deptId?: UserId;

    roleIds: number[];

    openId: string;
}

export type UserPageStatus = 0 | 1;
export type UserSortDirection = "ASC" | "DESC";
export type UserPageSearchField = "username" | "nickname" | "mobile" | "email" | string;

/** 用户分页对象 */
export interface UserPageVO {
    /** 用户ID */
    id: number | string;
    /** 用户头像URL */
    avatar?: string;
    /** 创建时间 */
    createTime?: UserDateValue;
    /** 部门名称 */
    deptName?: string;
    /** 用户邮箱 */
    email?: string;
    /** 性别 */
    gender?: UserGender;
    /** 手机号 */
    mobile?: string;
    /** 用户昵称 */
    nickname?: string;
    /** 角色名称，多个使用英文逗号(,)分割 */
    roleNames?: string;
    /** 用户状态(1:启用;0:禁用) */
    status?: UserPageStatus;
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
    status?: UserPageStatus;

    /** 部门ID */
    deptId?: UserId;

    /** 角色ID列表 */
    roleIds?: number[];

    /** 排序字段 */
    field?: UserPageSearchField;

    /** 排序方向 */
    direction?: UserSortDirection;

    /** 是否超级管理员 */
    isRoot?: boolean;

    /** 开始时间 */
    createTime?: [string, string];
}

/** 登录用户信息 */
export interface UserInfo {
    /** 用户ID */
    userId?: UserId;

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
