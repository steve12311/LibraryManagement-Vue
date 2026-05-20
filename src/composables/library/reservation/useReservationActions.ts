import { ref, shallowRef } from "vue"
import ReservationApi, {
  type ReservationQueueVO,
} from "@/api/library/reservation-api"
import { ElMessageBox } from "element-plus"

interface UseReservationActionsOptions {
  fetchData: () => Promise<void>
}

export function useReservationActions(options: UseReservationActionsOptions) {
  const toast = useToast()
  const queueData = shallowRef<ReservationQueueVO[]>([])
  const queueLoading = ref(false)
  const queueModalOpen = ref(false)
  const queueIsbn = ref("")

  async function confirmPickup(id: string) {
    try {
      await ElMessageBox.confirm("确认取书后状态将变为已完成", "确认取书？")
    } catch {
      return
    }
    try {
      await ReservationApi.adminConfirmPickup(id)
      toast.add({ title: "成功", description: "取书确认成功", color: "success" })
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "取书确认失败", color: "error" })
    }
  }

  async function cancelReservation(id: string) {
    try {
      await ElMessageBox.confirm("取消后不可恢复，确认取消该预约？", "确认取消？")
    } catch {
      return
    }
    try {
      await ReservationApi.adminCancel(id)
      toast.add({ title: "成功", description: "预约已取消", color: "success" })
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "取消预约失败", color: "error" })
    }
  }

  async function viewQueue(isbn: string) {
    queueIsbn.value = isbn
    queueModalOpen.value = true
    queueLoading.value = true
    try {
      const data = await ReservationApi.adminGetQueue(isbn)
      queueData.value = Array.isArray(data) ? data : []
    } catch {
      queueData.value = []
      toast.add({ title: "错误", description: "队列数据加载失败", color: "error" })
    } finally {
      queueLoading.value = false
    }
  }

  return {
    confirmPickup,
    cancelReservation,
    viewQueue,
    queueData,
    queueLoading,
    queueModalOpen,
    queueIsbn,
  }
}
