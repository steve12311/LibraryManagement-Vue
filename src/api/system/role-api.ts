import request from "@/utils/request";
import type {SelectMenuItem} from "@nuxt/ui";

const ROLE_BASE_URL = "/api/v1/roles";
const RoleAPI = {
    /** 获取角色分页数据 */
    getPage(queryParams?: RolePageQuery) {
        return request<any, PageResult<RolePageVO[]>>({
            url: `${ROLE_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        });
    },
    getOptions() {
        return request<any, SelectMenuItem[]>({
            url: `${ROLE_BASE_URL}/options`,
            method: "get",
        })
    },
    getRoleForm(roleId: number) {
        return request<any, RoleForm>({
            url: `${ROLE_BASE_URL}/${roleId}/form`,
            method: "get",
        })
    },
    create(data: RoleForm) {
        return request<any, string>({
            url: `${ROLE_BASE_URL}`,
            method: "post",
            data: data,
        })
    },
    update(id: number, data: RoleForm) {
        return request<any, string>({
            url: `${ROLE_BASE_URL}/${id}`,
            method: "put",
            data: data,
        })
    },
    updateRoleStatus(id: number, status: number) {
        return request<any, string>({
            url: `${ROLE_BASE_URL}/${id}/status`,
            method: "put",
            params: {
                status: status,
            },
        })
    },
    delete(ids: Array<number | string> | number | string) {
        const idsStr = Array.isArray(ids) ? ids.join(",") : String(ids);
        return request<any, string>({
            url: `${ROLE_BASE_URL}/${idsStr}`,
            method: "delete",
        })
    },
    getRoleMenuIds(roleId: number) {
        return request<any, number[]>({
            url: `${ROLE_BASE_URL}/${roleId}/menuIds`,
            method: "get",
        })
    },
    assignMenusToRole(roleId: number, menuIds: number[]) {
        return request<any, string>({
            url: `${ROLE_BASE_URL}/${roleId}/menus`,
            method: "put",
            data: menuIds,
        })
    },
    assignUsersToRole(roleId: number, userIds: number[]) {
        const idsStr = userIds.join(",");
        return request<any, string>({
            url: `${ROLE_BASE_URL}/${roleId}/users`,
            method: "put",
            params: {
                userIds: idsStr,
            }
        })
    }
}

export interface RoleForm {

    id: number;

    name: string;

    code: string;

    sort: number;

    status: number;

    dataScope: number;
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
    id?: number | string;
    /** 角色编码 */
    code?: string;
    /** 角色名称 */
    name?: string;
    /** 排序 */
    sort?: number;
    /** 角色状态 */
    status?: number;
    /** 创建时间 */
    createTime?: Date;
    /** 修改时间 */
    updateTime?: Date;
}

export default RoleAPI
