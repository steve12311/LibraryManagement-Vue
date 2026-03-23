export const BorrowStatusEnum = {
  RETURNED: 0,
  BORROWING: 1,
  OVERDUE: 2,
} as const

export type BorrowStatusValue = typeof BorrowStatusEnum[keyof typeof BorrowStatusEnum]
export type BorrowStatusFilterValue = BorrowStatusValue | -1
export type BorrowStatusColor = "neutral" | "success" | "error"
