import type { SelectItem } from "@nuxt/ui";
import {
  ReservationStatusEnum,
  type ReservationStatusColor,
  type ReservationStatusValue,
} from "@/enums/system/reservation-status-enum";

export function isReservationStatusValue(value: unknown): value is ReservationStatusValue {
  return (
    value === ReservationStatusEnum.PENDING ||
    value === ReservationStatusEnum.READY ||
    value === ReservationStatusEnum.FULFILLED ||
    value === ReservationStatusEnum.EXPIRED ||
    value === ReservationStatusEnum.CANCELLED
  );
}

export function normalizeReservationStatus(
  value: unknown,
  fallback: ReservationStatusValue = ReservationStatusEnum.PENDING,
): ReservationStatusValue {
  return isReservationStatusValue(value) ? value : fallback;
}

export function getReservationStatusLabel(status: ReservationStatusValue): string {
  if (status === ReservationStatusEnum.PENDING) return "等待中";
  if (status === ReservationStatusEnum.READY) return "可取书";
  if (status === ReservationStatusEnum.FULFILLED) return "已完成";
  if (status === ReservationStatusEnum.EXPIRED) return "已过期";
  return "已取消";
}

export function getReservationStatusColor(status: ReservationStatusValue): ReservationStatusColor {
  if (status === ReservationStatusEnum.PENDING) return "warning";
  if (status === ReservationStatusEnum.READY) return "success";
  if (status === ReservationStatusEnum.EXPIRED) return "error";
  return "neutral";
}

export function createReservationStatusItems(includeAll: boolean = false): SelectItem[] {
  const items: SelectItem[] = [
    { label: "等待中", value: ReservationStatusEnum.PENDING },
    { label: "可取书", value: ReservationStatusEnum.READY },
    { label: "已完成", value: ReservationStatusEnum.FULFILLED },
    { label: "已过期", value: ReservationStatusEnum.EXPIRED },
    { label: "已取消", value: ReservationStatusEnum.CANCELLED },
  ];
  if (!includeAll) return items;
  return [{ label: "全部", value: -1 }, ...items];
}

export function isReservationCancellable(status: ReservationStatusValue): boolean {
  return status === ReservationStatusEnum.PENDING || status === ReservationStatusEnum.READY;
}

export function isReservationPickupable(status: ReservationStatusValue): boolean {
  return status === ReservationStatusEnum.READY;
}
