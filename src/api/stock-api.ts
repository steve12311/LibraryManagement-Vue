import request from "@/utils/request";

const STOCK_BASE_URL = '/api/v1/stock'

const StockApi = {
    /**
     * 获取库存列表
     * @param queryParams
     */
    getPage(queryParams: StockQuery) {
        return request<any, PageResult<StockPageVO[]>>({
            url: `${STOCK_BASE_URL}/page`,
            method: "get",
            params: queryParams
        })
    },
    getFormData(isbn: string) {
        return request<any, StockForm | null>({
            url: `${STOCK_BASE_URL}/${isbn}`,
            method: "get",
        })
    },
    create(stockForm: StockForm) {
        return request({
            url: `${STOCK_BASE_URL}`,
            method: "post",
            data: stockForm
        })
    },
    update(stockForm: StockForm) {
        return request({
            url: `${STOCK_BASE_URL}`,
            method: "put",
            data: stockForm
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
    publishTime: Date
    categoryName: string
    stockNumber: number
    currentNumber: number
    price: number
    createTime: Date
}

export interface StockQuery extends PageQuery {
    field?: "name" | "isbn" | "author",
    keyword?: string
}

export interface StockForm {
    isbn: string;
    cover?: string;
    name: string;
    intro: string;
    author: string;
    pressId: number | undefined;
    publishTime: Date;
    categoryId: number | undefined;
    price: number;
    stock: number;
}

export default StockApi
