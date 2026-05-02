import { ref, watch, type Ref } from "vue"
import type { BorrowPageVO } from "@/api/library/borrow-api"

interface UseBorrowDialogOptions {
  loadingBorrowOptions: Ref<boolean>
  submittingBorrow: Ref<boolean>
  submittingDelay: Ref<boolean>
  resetBorrowForm: () => void
  fetchUserOptions: () => Promise<void>
  fetchBookOptions: () => Promise<void>
  parseDate: (value?: Date | string | null) => Date | null
}

export function useBorrowDialog(options: UseBorrowDialogOptions) {
  const toast = useToast()
  const open = ref(false)
  const openConfirm = ref(false)
  const selectedDelayBorrowId = ref("")
  const selectedDelayReturnTime = ref<Date | null>(null)
  const delayDay = ref(1)

  watch(open, (isOpen) => {
    if (!isOpen) {
      options.resetBorrowForm()
      options.submittingBorrow.value = false
    }
  })

  watch(openConfirm, (isOpen) => {
    if (!isOpen) {
      resetDelayForm()
      options.submittingDelay.value = false
    }
  })

  async function openCreateModal() {
    options.loadingBorrowOptions.value = true
    try {
      await Promise.all([options.fetchUserOptions(), options.fetchBookOptions()])
      open.value = true
    } catch {
      toast.add({ title: "错误", description: "选项加载失败", color: "error" })
    } finally {
      options.loadingBorrowOptions.value = false
    }
  }

  function openDelayModal(row: BorrowPageVO) {
    selectedDelayBorrowId.value = row.borrowId
    selectedDelayReturnTime.value = options.parseDate(row.returnTime) ?? new Date()
    delayDay.value = 1
    openConfirm.value = true
  }

  function resetDelayForm() {
    delayDay.value = 1
    selectedDelayBorrowId.value = ""
    selectedDelayReturnTime.value = null
  }

  return { open, openConfirm, selectedDelayBorrowId, selectedDelayReturnTime, delayDay, openCreateModal, openDelayModal, resetDelayForm }
}
