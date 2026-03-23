import { reactive, ref, shallowRef } from "vue"
import FileApi from "@/api/file-api"
import UserAPI, {
  type MyBorrowPageQuery,
  type MyBorrowPageVO
} from "@/api/system/user-api"
import type { BorrowStatusFilterValue } from "@/enums/system/borrow-status-enum"
import {
  createBorrowStatusItems,
  getBorrowStatusColor,
  getBorrowStatusLabel,
  normalizeBorrowStatus
} from "@/utils/borrow-status"

function normalizeText(value?: string) {
  return String(value ?? "").trim()
}

function normalizeBorrowRecord(raw?: Partial<MyBorrowPageVO>): MyBorrowPageVO {
  return {
    borrowId: normalizeText(raw?.borrowId),
    isbn: normalizeText(raw?.isbn),
    cover: FileApi.resolveUrl(raw?.cover),
    bookName: normalizeText(raw?.bookName),
    returnTime: raw?.returnTime ?? "",
    status: normalizeBorrowStatus(raw?.status),
  }
}

export function useMyBorrowOrders() {
  const toast = useToast()
  const requestSerial = ref(0)
  const loadingMyBorrowOrders = ref(false)
  const myBorrowOrders = shallowRef<MyBorrowPageVO[]>([])
  const totalMyBorrowOrders = ref(0)
  const myBorrowQueryParams = reactive<MyBorrowPageQuery>({
    pageNum: 1,
    pageSize: 6,
    status: void 0,
  })
  const myBorrowStatusFilter = ref<BorrowStatusFilterValue>(-1)
  const myBorrowStatusItems = ref(createBorrowStatusItems(true))

  function applyBorrowFilters() {
    myBorrowQueryParams.status = myBorrowStatusFilter.value === -1 ? void 0 : myBorrowStatusFilter.value
  }

  async function fetchMyBorrowOrders() {
    const currentRequestSerial = ++requestSerial.value
    try {
      loadingMyBorrowOrders.value = true
      applyBorrowFilters()
      const data = await UserAPI.getMyBorrowPage(myBorrowQueryParams)
      if (currentRequestSerial !== requestSerial.value) return
      myBorrowOrders.value = Array.isArray(data.list)
        ? data.list.map((item) => normalizeBorrowRecord(item))
        : []
      totalMyBorrowOrders.value = Number(data.total ?? 0)
    } catch (error) {
      if (currentRequestSerial !== requestSerial.value) return
      myBorrowOrders.value = []
      totalMyBorrowOrders.value = 0
      toast.add({
        title: "错误",
        description: error instanceof Error ? error.message : "借阅订单加载失败",
        color: "error"
      })
    } finally {
      if (currentRequestSerial === requestSerial.value) {
        loadingMyBorrowOrders.value = false
      }
    }
  }

  async function handleBorrowQuery() {
    myBorrowQueryParams.pageNum = 1
    await fetchMyBorrowOrders()
  }

  function resetBorrowQuery() {
    myBorrowStatusFilter.value = -1
    myBorrowQueryParams.pageNum = 1
    void fetchMyBorrowOrders()
  }

  function formatBorrowReturnTime(value?: Date | string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return "-"
    }
    return date.toLocaleString("zh-CN")
  }

  return {
    myBorrowOrders,
    totalMyBorrowOrders,
    loadingMyBorrowOrders,
    myBorrowQueryParams,
    myBorrowStatusFilter,
    myBorrowStatusItems,
    fetchMyBorrowOrders,
    handleBorrowQuery,
    resetBorrowQuery,
    getBorrowStatusLabel,
    getBorrowStatusColor,
    formatBorrowReturnTime,
  }
}
