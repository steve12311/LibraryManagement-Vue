import type { SelectItem } from "@nuxt/ui";
import {
  BorrowStatusEnum,
  type BorrowStatusColor,
  type BorrowStatusValue,
} from "@/enums/system/borrow-status-enum";

export function isBorrowStatusValue(value: unknown): value is BorrowStatusValue {
  return (
    value === BorrowStatusEnum.RETURNED ||
    value === BorrowStatusEnum.BORROWING ||
    value === BorrowStatusEnum.OVERDUE
  );
}

export function normalizeBorrowStatus(
  value: unknown,
  fallback: BorrowStatusValue = BorrowStatusEnum.BORROWING,
): BorrowStatusValue {
  return isBorrowStatusValue(value) ? value : fallback;
}

export function getBorrowStatusLabel(status: BorrowStatusValue) {
  if (status === BorrowStatusEnum.RETURNED) return "已归还";
  if (status === BorrowStatusEnum.OVERDUE) return "已逾期";
  return "借阅中";
}

export function getBorrowStatusColor(status: BorrowStatusValue): BorrowStatusColor {
  if (status === BorrowStatusEnum.RETURNED) return "neutral";
  if (status === BorrowStatusEnum.OVERDUE) return "error";
  return "success";
}

export function createBorrowStatusItems(includeAll: boolean = false): SelectItem[] {
  const items: SelectItem[] = [
    {
      label: "已归还",
      value: BorrowStatusEnum.RETURNED,
    },
    {
      label: "借阅中",
      value: BorrowStatusEnum.BORROWING,
    },
    {
      label: "已逾期",
      value: BorrowStatusEnum.OVERDUE,
    },
  ];

  if (!includeAll) {
    return items;
  }

  return [
    {
      label: "全部",
      value: -1,
    },
    ...items,
  ];
}

export function isBorrowReturned(status: BorrowStatusValue) {
  return status === BorrowStatusEnum.RETURNED;
}
