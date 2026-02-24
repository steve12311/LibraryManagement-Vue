import request from "@/utils/request";
import type {InputMenuItem} from "@nuxt/ui";

const BOOK_BASE_URL = "/api/v1/book";

const BookApi = {
    getOptions() {
        return request<any, InputMenuItem[]>({
            url: `${BOOK_BASE_URL}/options`,
            method: "GET",
        })
    },
    update(data: BookForm) {
        return request({
            url: `${BOOK_BASE_URL}`,
            method: "put",
            data: data
        })
    },
    getFormData(isbn: string) {
        return request<any, BookForm>({
            url: `${BOOK_BASE_URL}/${isbn}/form`,
            method: "get",
        })
    }
}

export interface BookForm {
    isbn: string;
    cover: string;
    name: string;
    intro: string;
    author: string;
    pressId: string | number;
    publishTime: Date;
    categoryId: string | number;
    price: number;
}

export default BookApi;