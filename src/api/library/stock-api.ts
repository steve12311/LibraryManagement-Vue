import request from "@/utils/request";

const STOCK_BASE_URL = "/api/v1/stock";
export type StockSearchField = "name" | "isbn" | "author";
export type StockDateValue = string | Date;

const StockApi = {
    /**
     * 获取库存列表
     * @param queryParams
     */
    getPage(queryParams?: StockQuery) {
        return request<unknown, PageResult<StockPageVO[]>>({
            url: `${STOCK_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        })
    },
    getFormData(isbn: string) {
        return request<unknown, StockForm | null>({
            url: `${STOCK_BASE_URL}/${isbn}`,
            method: "get",
        })
    },
    create(stockForm: StockForm) {
        return request<StockForm, string>({
            url: `${STOCK_BASE_URL}`,
            method: "post",
            data: stockForm,
        })
    },
    update(stockForm: StockForm) {
        return request<StockForm, string>({
            url: `${STOCK_BASE_URL}`,
            method: "put",
            data: stockForm,
        })
    }
}

export interface StockPageVO {
    isbn: string
    bookImage?: string
    name: string
    intro?: string
    author?: string
    publishName: string
    publishTime: StockDateValue
    categoryName: string
    stockNumber: number
    currentNumber: number
    price: number
    createTime: StockDateValue
}

export interface StockQuery extends PageQuery {
    field?: StockSearchField,
    keyword?: string
}

export interface StockForm {
    isbn: string;
    stock: number;
    cover?: string;
    name?: string;
    intro?: string;
    author?: string;
    pressId?: number;
    publishTime?: StockDateValue;
    categoryId?: number;
    price?: number;
}

export default StockApi
