import request from "../utils/request";

const PUBLISH_BASE_URL = '/api/v1/publish'

const publishApi = {
    getPage(queryParams: PublishQuery) {
        return request<any, PageResult<PublishPageVO[]>>({
            url: `${PUBLISH_BASE_URL}`,
            method: "get",
            params: queryParams
        })
    },
    getFormData(id: number) {
        return request<any, PublishForm>({
            url: `${PUBLISH_BASE_URL}/${id}/form`,
            method: "get"
        })
    },
    create(data: PublishForm) {
        return request({
            url: `${PUBLISH_BASE_URL}`,
            method: "post",
            data
        })
    },
    update(id: number, data: PublishForm) {
        return request({
            url: `${PUBLISH_BASE_URL}/${id}`,
            method: "put",
            data
        })
    },
    delete(deleteIds: number[]) {
        const deleteIdsStr = deleteIds.join(",");
        return request({url: `${PUBLISH_BASE_URL}/${deleteIdsStr}`, method: "delete"});
    },
}

export interface PublishForm {
    id?: number;
    name?: string;
    country?: string;
    province?: string;
    city?: string;
    area?: string;
    areaDetail?: string;
    postalCode?: string;
    telephone?: string;
    email?: string
}

export interface PublishPageVO {
    publishId: number;
    publishName: string;
    address: string;
    addressCode: string;
    phonenumber: string;
    createTime: Date;
}

export interface PublishQuery extends PageQuery {
    field?: "publishName" | "address";
    keyword?: string
}

export default publishApi;