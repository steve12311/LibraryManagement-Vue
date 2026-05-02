export type ModalEditMode = "add" | "edit"

export type BorrowDateValue = string | Date | null | undefined

export interface CoverFileLike {
  file?: File
  raw?: File
}

export type CoverFileModel = File | CoverFileLike | (File | CoverFileLike)[]

export interface CategoryTreeNode {
  level?: number
  data?: { value?: string | number }
}
