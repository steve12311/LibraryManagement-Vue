import request from "../utils/request.ts";

const CATEGORY_BASE_URL = "/api/v1/category"

const CategoryApi = {
    getList(queryParams: CategoryQuery) {
        return request<any, CategoryVO[]>({url: `${CATEGORY_BASE_URL}`, method: "get", params: queryParams})
    }
}

export interface CategoryVO {
    id?: number;
    categoryName?: string;
    parentId?: number;
    code?: string;
    treePath?: string;
    children?: CategoryVO[];
}

export interface CategoryQuery {
    categoryName?: string;
}

export default CategoryApi;