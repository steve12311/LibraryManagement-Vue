import request from "../utils/request";

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
}

export interface RolePageQuery extends PageQuery {
    /** 搜索关键字 */
    keywords?: string;
}
export interface RolePageVO {
    /** 角色ID */
    id?: string;
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