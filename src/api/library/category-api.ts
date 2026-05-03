import request from "@/utils/request";

const CATEGORY_BASE_URL = "/api/v1/category";
export type CategoryId = number;
export type CategoryStatus = 0 | 1;

const CategoryApi = {
    getList(queryParams?: CategoryQuery) {
        return request<unknown, CategoryVO[]>({url: `${CATEGORY_BASE_URL}`, method: "get", params: queryParams})
    },
    getChildren(queryParams?: CategoryQuery) {
        return request<unknown, CategoryVO[]>({url: `${CATEGORY_BASE_URL}/children`, method: "get", params: queryParams})
    },
    getOptions() {
        return request<unknown, OptionType[]>({
            url: `${CATEGORY_BASE_URL}/options`,
            method: "get",
        })
    },
    getLazyOptions(parentId?: CategoryId) {
        return request<unknown, CategoryLazyOption[]>({
            url: `${CATEGORY_BASE_URL}/options/lazy`,
            method: "get",
            params: {
                parentId,
            }
        })
    },
    getOptionNode(categoryId: CategoryId) {
        return request<unknown, CategoryLazyOption | null>({
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
    hasChildren?: boolean;
    children?: CategoryVO[];
}

export interface CategoryQuery {
    parentId?: CategoryId;
    categoryName?: string;
    status?: CategoryStatus;
}

export interface CategoryLazyOption extends OptionType {
    leaf?: boolean;
    children?: CategoryLazyOption[];
}

export default CategoryApi;
