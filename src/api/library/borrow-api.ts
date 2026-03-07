import request from "@/utils/request";

const BORROW_BASE_URL = "/api/v1/borrow";
export type BorrowId = string;
export type BorrowDateValue = string | Date;
export type BorrowQueryField = "username" | "isbn" | "status";
export type BorrowStatusValue = 0 | 1 | 2;

const BorrowApi = {
    getPage(queryParams?: BorrowQuery) {
        return request<unknown, PageResult<BorrowPageVO[]>>({
            url: `${BORROW_BASE_URL}/page`,
            method: "get",
            params: queryParams,
        })
    },
    create(borrowForm: BorrowForm) {
        return request<BorrowForm, string>({
            url: `${BORROW_BASE_URL}`,
            method: "post",
            data: borrowForm,
        })
    },
    update(borrowId: BorrowId, borrowForm: BorrowForm) {
        return request<BorrowForm, string>({
            url: `${BORROW_BASE_URL}/${borrowId}`,
            method: "put",
            data: borrowForm,
        })
    }
}

export interface BorrowForm {
    isbn?: string;
    userId?: number | string;
    returnTime?: BorrowDateValue;
    realityReturnTime?: BorrowDateValue;
}

export interface BorrowPageVO {
    borrowId: BorrowId;
    isbn: string;
    bookName: string;
    userId: number;
    nickname: string;
    username: string;
    avatar?: string;
    returnTime: BorrowDateValue;
    realityReturnTime?: BorrowDateValue | null;
}

export interface BorrowQuery extends PageQuery {
    field?: BorrowQueryField;
    keyword?: string | BorrowStatusValue;
}

export default BorrowApi;
