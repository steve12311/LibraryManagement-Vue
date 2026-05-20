import request from "@/utils/request";
import type { ReservationStatusValue } from "@/enums/system/reservation-status-enum";

const RESERVATION_BASE_URL = "/api/v1/reservation";
const ADMIN_RESERVATION_BASE_URL = "/api/v1/admin/reservation";

export type ReservationId = string;
export type ReservationQueryField = "username" | "isbn" | "status";

export interface ReservationPageVO {
  id: ReservationId;
  isbn: string;
  cover?: string;
  bookName: string;
  status: ReservationStatusValue;
  pickupDeadline?: string | null;
  createTime: string;
}

export interface AdminReservationPageVO extends ReservationPageVO {
  userId: number;
  nickname: string;
  username: string;
  avatar?: string;
}

export interface ReservationQuery extends PageQuery {
  field?: ReservationQueryField;
  keyword?: string | ReservationStatusValue;
}

export interface ReservationQueueVO {
  id: ReservationId;
  userId: number;
  nickname: string;
  username: string;
  status: ReservationStatusValue;
  createTime: string;
}

const ReservationApi = {
  getPage(queryParams?: ReservationQuery) {
    return request<unknown, PageResult<ReservationPageVO[]>>({
      url: `${RESERVATION_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },
  create(isbn: string) {
    return request<{ isbn: string }, string>({
      url: RESERVATION_BASE_URL,
      method: "post",
      data: { isbn },
    });
  },
  cancel(id: ReservationId) {
    return request<unknown, string>({
      url: `${RESERVATION_BASE_URL}/${id}`,
      method: "delete",
    });
  },
  adminGetPage(queryParams?: ReservationQuery) {
    return request<unknown, PageResult<AdminReservationPageVO[]>>({
      url: `${ADMIN_RESERVATION_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },
  adminGetQueue(isbn: string) {
    return request<unknown, ReservationQueueVO[]>({
      url: `${ADMIN_RESERVATION_BASE_URL}/queue/${isbn}`,
      method: "get",
    });
  },
  adminConfirmPickup(id: ReservationId) {
    return request<unknown, string>({
      url: `${ADMIN_RESERVATION_BASE_URL}/${id}/pickup`,
      method: "put",
    });
  },
  adminCancel(id: ReservationId) {
    return request<unknown, string>({
      url: `${ADMIN_RESERVATION_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default ReservationApi;
