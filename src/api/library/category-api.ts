import request from "@/utils/request";

const CATEGORY_BASE_URL = "/api/v1/category";
export type CategoryId = number;
export type CategoryStatus = 0 | 1;

const CategoryApi = {
    getList(queryParams?: CategoryQuery) {
        return request<any, CategoryVO[]>({url: `${CATEGORY_BASE_URL}`, method: "get", params: queryParams})
    },
    getOptions() {
        return request<any, OptionType[]>({
            url: `${CATEGORY_BASE_URL}/options`,
            method: "get",
        })
    },
    getLazyOptions(parentId?: CategoryId) {
        return request<any, CategoryLazyOption[]>({
            url: `${CATEGORY_BASE_URL}/options/lazy`,
            method: "get",
            params: {
                parentId,
            }
        })
    },
    getOptionNode(categoryId: CategoryId) {
        return request<any, CategoryLazyOption | null>({
            url: `${CATEGORY_BASE_URL}/options/node/${categoryId}`,
            method: "get",
        })
    },
}

export interface CategoryVO {
    categoryId?: CategoryId;
    categoryName?: string;
    parentId?: CategoryId;
    code?: string;
    treePath?: string;
    children?: CategoryVO[];
}

export interface CategoryQuery {
    categoryName?: string;
    status?: CategoryStatus;
}

export interface CategoryLazyOption extends OptionType {
    leaf?: boolean;
    children?: CategoryLazyOption[];
}

export default CategoryApi;
