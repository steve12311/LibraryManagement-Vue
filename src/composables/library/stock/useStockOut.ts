import {ref, watch} from "vue";
import type {Ref} from "vue";
import stockApi, {type StockForm, type StockPageVO} from "@/api/library/stock-api.ts";

interface UseStockOutOptions {
  openStockOutDialog: Ref<boolean>
  fetchData: () => Promise<void>
}

export function useStockOut(options: UseStockOutOptions) {
  const toast = useToast()
  const stockOutIsbn = ref("")
  const stockOutNumber = ref(0)
  const stockOutMaxNumber = ref(0)
  const submittingStockOut = ref(false)

  function resetStockOutForm() {
    stockOutIsbn.value = ""
    stockOutNumber.value = 0
    stockOutMaxNumber.value = 0
    submittingStockOut.value = false
  }

  watch(options.openStockOutDialog, (isOpen) => {
    if (!isOpen) {
      resetStockOutForm()
    }
  })

  function openStockOutModal(row: StockPageVO) {
    stockOutIsbn.value = row.isbn
    stockOutMaxNumber.value = Math.max(0, Number(row.currentNumber ?? 0))
    stockOutNumber.value = 0
    options.openStockOutDialog.value = true
  }

  async function submitStockOut() {
    if (!stockOutIsbn.value) {
      toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
      return
    }
    if (stockOutNumber.value <= 0) {
      toast.add({title: "错误", description: "出库数量必须大于0", color: "error"})
      return
    }
    if (stockOutNumber.value > stockOutMaxNumber.value) {
      toast.add({title: "错误", description: "出库数量不能大于可用库存", color: "error"})
      return
    }

    try {
      submittingStockOut.value = true
      const formData = await stockApi.getFormData(stockOutIsbn.value)
      if (!formData) {
        toast.add({title: "错误", description: "未找到图书信息", color: "error"})
        return
      }

      const payload: StockForm = {
        ...formData,
        isbn: stockOutIsbn.value,
        stock: stockOutNumber.value,
      }
      await stockApi.update(payload)
      toast.add({title: "成功", description: "出库成功", color: "success"})
      options.openStockOutDialog.value = false
      await options.fetchData()
    } catch {
      toast.add({title: "错误", description: "出库失败", color: "error"})
    } finally {
      submittingStockOut.value = false
    }
  }

  return {
    stockOutIsbn,
    stockOutNumber,
    stockOutMaxNumber,
    submittingStockOut,
    resetStockOutForm,
    openStockOutModal,
    submitStockOut,
  }
}
