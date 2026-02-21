import request from "../utils/request";

const STOCK_BASE_URL = '/api/v1/stock'

const stockApi = {
    /**
     * 获取库存列表
     * @param queryParams
     */
    getPage(queryParams: StockQuery) {
        return request<any, PageResult<StockPageVO[]>>({
            url: `${STOCK_BASE_URL}`,
            method: "get",
            params: queryParams
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
    createTime: Date
}

export interface StockQuery extends PageQuery {
    field?: "name" | "isbn" | "author",
    keyword?: string
}

export default stockApi