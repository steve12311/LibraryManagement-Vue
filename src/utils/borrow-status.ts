import type { SelectItem } from "@nuxt/ui"
import {
  BorrowStatusEnum,
  type BorrowStatusColor,
  type BorrowStatusValue
} from "@/enums/system/borrow-status-enum"
export type BorrowDateValue = string | Date | null | undefined

export function isBorrowStatusValue(value: unknown): value is BorrowStatusValue {
  return value === BorrowStatusEnum.RETURNED
    || value === BorrowStatusEnum.BORROWING
    || value === BorrowStatusEnum.OVERDUE
}

export function normalizeBorrowStatus(value: unknown, fallback: BorrowStatusValue = BorrowStatusEnum.BORROWING): BorrowStatusValue {
  return isBorrowStatusValue(value) ? value : fallback
}

/**
 * 根据实际归还日期和应还日期推算借阅状态：
 * 有实际归还时间 → RETURNED，已过应还日期 → OVERDUE，其余 → BORROWING
 */
export function resolveBorrowStatus(returnTime?: BorrowDateValue, realityReturnTime?: BorrowDateValue): BorrowStatusValue {
  if (parseBorrowDate(realityReturnTime)) {
    return BorrowStatusEnum.RETURNED
  }

  const dueDate = parseBorrowDate(returnTime)
  if (!dueDate) {
    return BorrowStatusEnum.BORROWING
  }

  const dueDateStart = new Date(dueDate)
  dueDateStart.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (dueDateStart < now) {
    return BorrowStatusEnum.OVERDUE
  }

  return BorrowStatusEnum.BORROWING
}

export function getBorrowStatusLabel(status: BorrowStatusValue) {
  if (status === BorrowStatusEnum.RETURNED) return "已归还"
  if (status === BorrowStatusEnum.OVERDUE) return "已逾期"
  return "借阅中"
}

export function getBorrowStatusColor(status: BorrowStatusValue): BorrowStatusColor {
  if (status === BorrowStatusEnum.RETURNED) return "neutral"
  if (status === BorrowStatusEnum.OVERDUE) return "error"
  return "success"
}

export function createBorrowStatusItems(includeAll: boolean = false): SelectItem[] {
  const items: SelectItem[] = [
    {
      label: "已归还",
      value: BorrowStatusEnum.RETURNED
    },
    {
      label: "借阅中",
      value: BorrowStatusEnum.BORROWING
    },
    {
      label: "已逾期",
      value: BorrowStatusEnum.OVERDUE
    }
  ]

  if (!includeAll) {
    return items
  }

  return [
    {
      label: "全部",
      value: -1
    },
    ...items,
  ]
}

export function isBorrowReturned(status: BorrowStatusValue) {
  return status === BorrowStatusEnum.RETURNED
}

function parseBorrowDate(value?: BorrowDateValue) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  return target
}
