import request from "@/utils/request";
import type {SelectMenuItem} from "@nuxt/ui";

const PUBLISH_BASE_URL = "/api/v1/publish";
export type PublishId = number;
export type PublishDateValue = string | Date;
export type PublishQueryField = "publishName" | "address";

const PublishApi = {
    getPage(queryParams?: PublishQuery) {
        return request<unknown, PageResult<PublishPageVO[]>>({
            url: `${PUBLISH_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        })
    },
    getOptions() {
        return request<unknown, SelectMenuItem[]>({
            url: `${PUBLISH_BASE_URL}/options`,
            method: "get",
        })
    },
    getFormData(id: PublishId) {
        return request<unknown, PublishForm>({
            url: `${PUBLISH_BASE_URL}/${id}/form`,
            method: "get",
        })
    },
    create(data: PublishForm) {
        return request<PublishForm, string>({
            url: `${PUBLISH_BASE_URL}`,
            method: "post",
            data,
        })
    },
    update(data: PublishForm) {
        return request<PublishForm, string>({
            url: `${PUBLISH_BASE_URL}`,
            method: "put",
            data,
        })
    },
    delete(deleteIds: PublishId[] | PublishId) {
        const deleteIdsStr = Array.isArray(deleteIds) ? deleteIds.join(",") : String(deleteIds);
        return request<unknown, string>({url: `${PUBLISH_BASE_URL}/${deleteIdsStr}`, method: "delete"});
    },
}

export interface PublishForm {
    id?: PublishId;
    name: string;
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
    publishId: PublishId;
    publishName: string;
    address?: string;
    addressCode?: string;
    phonenumber?: string;
    createTime?: PublishDateValue;
}

export interface PublishQuery extends PageQuery {
    field?: PublishQueryField;
    keyword?: string
}

export default PublishApi;
