import request from "@/utils/request";

const PUBLIC_BOOK_BASE_URL = "/api/v1/index/books";

export type PublicBookSearchField = "name" | "isbn" | "author";
export type PublicBookDateValue = string | Date;

const PublicBookApi = {
    getPage(queryParams?: PublicBookQuery) {
        return request<unknown, PageResult<PublicBookPageVO[]>>({
            url: `${PUBLIC_BOOK_BASE_URL}/page`,
            method: "get",
            params: queryParams,
            headers: {
                Authorization: "no-auth",
            },
        });
    },
};

export interface PublicBookPageVO {
    coverUrl?: string;
    name: string;
    isbn: string;
    available: boolean;
    intro?: string;
    categoryName?: string;
    publishName?: string;
    publishTime?: PublicBookDateValue;
    price?: number;
    author?: string;
}

export interface PublicBookQuery extends PageQuery {
    field?: PublicBookSearchField;
    keyword?: string;
}

export default PublicBookApi;
