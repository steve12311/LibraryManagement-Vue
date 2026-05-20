export const ReservationStatusEnum = {
  PENDING: 0,
  READY: 1,
  FULFILLED: 2,
  EXPIRED: 3,
  CANCELLED: 4,
} as const;

export type ReservationStatusValue =
  (typeof ReservationStatusEnum)[keyof typeof ReservationStatusEnum];
export type ReservationStatusFilterValue = ReservationStatusValue | -1;
export type ReservationStatusColor = "warning" | "success" | "neutral" | "error";
