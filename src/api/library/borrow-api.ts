import request from "@/utils/request";

const BORROW_BASE_URL = '/api/v1/borrow'

const BorrowApi = {
    getPage(queryParams: BorrowQuery) {
        return request<any, PageResult<BorrowPageVO[]>>({
            url: `${BORROW_BASE_URL}/page`,
            method: "GET",
            params: queryParams
        })
    },
    create(borrowForm: BorrowForm) {
        return request({
            url: `${BORROW_BASE_URL}`,
            method: "POST",
            data: borrowForm
        })
    },
    update(uuid: string, borrowForm: BorrowForm) {
        return request({
            url: `${BORROW_BASE_URL}/${uuid}`,
            method: "PUT",
            data: borrowForm
        })
    }
}

export interface BorrowForm {
    isbn?: string
    userId?: string
    returnTime?: Date,
    realityReturnTime?: Date
}

export interface BorrowPageVO {
    borrowId: string
    isbn: string
    bookName: string
    userId: number
    nickname: string
    username: string
    avatar: string
    returnTime: Date
    realityReturnTime: Date
}

export interface BorrowQuery extends PageQuery {
    field?: "username" | "isbn" | "status",
    keyword?: string
}

export default BorrowApi;