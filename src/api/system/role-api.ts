import request from "@/utils/request";
import type {SelectMenuItem} from "@nuxt/ui";

const ROLE_BASE_URL = "/api/v1/roles";
export type RoleId = number | string;
export type RoleStatus = 0 | 1;
export type RoleDataScope = 1 | 2 | 3 | 4;

const RoleAPI = {
    /** 获取角色分页数据 */
    getPage(queryParams?: RolePageQuery) {
        return request<unknown, PageResult<RolePageVO[]>>({
            url: `${ROLE_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        });
    },
    getOptions() {
        return request<unknown, SelectMenuItem[]>({
            url: `${ROLE_BASE_URL}/options`,
            method: "get",
        })
    },
    getRoleForm(roleId: RoleId) {
        return request<unknown, RoleForm>({
            url: `${ROLE_BASE_URL}/${roleId}/form`,
            method: "get",
        })
    },
    create(data: RoleForm) {
        return request<unknown, string, RoleForm>({
            url: `${ROLE_BASE_URL}`,
            method: "post",
            data: data,
        })
    },
    update(id: RoleId, data: RoleForm) {
        return request<unknown, string, RoleForm>({
            url: `${ROLE_BASE_URL}/${id}`,
            method: "put",
            data: data,
        })
    },
    updateRoleStatus(id: RoleId, status: RoleStatus) {
        return request<unknown, string>({
            url: `${ROLE_BASE_URL}/${id}/status`,
            method: "put",
            params: {
                status: status,
            },
        })
    },
    delete(ids: RoleId[] | RoleId) {
        const idsStr = Array.isArray(ids) ? ids.join(",") : String(ids);
        return request<unknown, string>({
            url: `${ROLE_BASE_URL}/${idsStr}`,
            method: "delete",
        })
    },
    getRoleMenuIds(roleId: RoleId) {
        return request<unknown, number[]>({
            url: `${ROLE_BASE_URL}/${roleId}/menuIds`,
            method: "get",
        })
    },
    assignMenusToRole(roleId: RoleId, menuIds: number[]) {
        return request<unknown, string, number[]>({
            url: `${ROLE_BASE_URL}/${roleId}/menus`,
            method: "put",
            data: menuIds,
        })
    },
    assignUsersToRole(roleId: RoleId, userIds: number[]) {
        const idsStr = userIds.join(",");
        return request<unknown, string>({
            url: `${ROLE_BASE_URL}/${roleId}/users`,
            method: "put",
            params: {
                userIds: idsStr,
            }
        })
    }
}

export interface RoleForm {

    id?: number;

    name: string;

    code: string;

    sort: number;

    status: RoleStatus;

    dataScope: RoleDataScope;
}

export interface RolePageQuery extends PageQuery {
    /** 搜索关键字 */
    keywords?: string;
    /** 开始日期 */
    startDate?: string;
    /** 结束日期 */
    endDate?: string;
}

export interface RolePageVO {
    /** 角色ID */
    id?: RoleId;
    /** 角色编码 */
    code?: string;
    /** 角色名称 */
    name?: string;
    /** 排序 */
    sort?: number;
    /** 角色状态 */
    status?: RoleStatus;
    /** 创建时间 */
    createTime?: string | Date;
    /** 修改时间 */
    updateTime?: string | Date;
}

export default RoleAPI
