import type { Ref } from "vue"
import type { PublishForm, PublishId, PublishPageVO } from "@/api/library/publish-api"
import publishApi from "@/api/library/publish-api"
import { ElMessageBox } from "element-plus"

interface UsePublishActionsOptions {
  state: Ref<PublishForm>
  open: Ref<boolean>
  editModalMode: Ref<"add" | "edit">
  editingPublishId: Ref<PublishId | undefined>
  loadingEditPublish: Ref<boolean>
  submittingPublish: Ref<boolean>
  deletingPublish: Ref<boolean>
  normalizePublishPayload: (raw: PublishForm, overrideId?: PublishId) => PublishForm
  fetchData: () => Promise<void>
  getSelectedRows: () => { original: PublishPageVO }[]
  toggleAllRows: (selected: boolean) => void
}

export function usePublishActions(options: UsePublishActionsOptions) {
  const toast = useToast()

  async function submitForm() {
    if (options.submittingPublish.value || options.loadingEditPublish.value) return
    const payload = options.normalizePublishPayload(
      options.state.value,
      options.editModalMode.value === "edit" ? options.editingPublishId.value : undefined,
    )
    if (!payload.name) {
      toast.add({ title: "错误", description: "名称不可为空", color: "error" })
      return
    }
    try {
      options.submittingPublish.value = true
      if (options.editModalMode.value === "add") {
        await publishApi.create(payload)
        toast.add({ title: "成功", description: "新增成功", color: "success" })
      } else {
        if (payload.id === undefined || payload.id === null) {
          toast.add({ title: "错误", description: "出版社ID不能为空", color: "error" })
          return
        }
        await publishApi.update(payload)
        toast.add({ title: "成功", description: "修改成功", color: "success" })
      }
      options.open.value = false
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: options.editModalMode.value === "add" ? "新增失败" : "修改失败", color: "error" })
    } finally {
      options.submittingPublish.value = false
    }
  }

  async function deletePublishBySelection() {
    if (options.deletingPublish.value) return
    const selectedRows = options.getSelectedRows()
    if (!selectedRows.length) {
      toast.add({ title: "错误", description: "请选择需要删除的出版社", color: "error" })
      return
    }
    const selectedPublishes = selectedRows
      .map((row) => row.original)
      .filter((item) => item.publishId !== undefined && item.publishId !== null)
    const ids = selectedPublishes
      .map((item) => Number(item.publishId))
      .filter((id) => Number.isFinite(id))
    if (!ids.length) {
      toast.add({ title: "错误", description: "无可删除的出版社数据", color: "error" })
      return
    }
    const content = ids.length === 1
      ? `确定删除出版社 ${selectedPublishes[0]?.publishName || ids[0]} 吗？`
      : `确定删除选中的 ${ids.length} 个出版社吗？`
    try {
      await ElMessageBox.confirm(content, "删除出版社", { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" })
    } catch {
      return
    }
    try {
      options.deletingPublish.value = true
      await publishApi.delete(ids)
      toast.add({ title: "成功", description: "删除成功", color: "success" })
      options.toggleAllRows(false)
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "删除失败", color: "error" })
    } finally {
      options.deletingPublish.value = false
    }
  }

  async function confirmDeletePublish(id: PublishId, name?: string) {
    const content = name?.trim() ? `确定删除出版社 ${name} 吗？` : '确定删除该出版社吗？'
    try {
      await ElMessageBox.confirm(content, "删除出版社", { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" })
    } catch {
      return
    }
    try {
      options.deletingPublish.value = true
      await publishApi.delete([Number(id)])
      toast.add({ title: "成功", description: "删除成功", color: "success" })
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "删除失败", color: "error" })
    } finally {
      options.deletingPublish.value = false
    }
  }

  return { submitForm, deletePublishBySelection, confirmDeletePublish }
}
