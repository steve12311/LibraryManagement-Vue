import { ref, watch, type Ref } from "vue"
import type { PublishForm, PublishId } from "@/api/library/publish-api"

interface UsePublishDialogOptions {
  loadingEditPublish: Ref<boolean>
  submittingPublish: Ref<boolean>
  editModalMode: Ref<"add" | "edit">
  editModalTitle: Ref<string>
  editingPublishId: Ref<PublishId | undefined>
  state: Ref<PublishForm>
  createPublishForm: (overrides?: Partial<PublishForm>) => PublishForm
  loadPublishForm: (id: PublishId | undefined) => Promise<PublishForm | undefined>
  getFirstSelectedRow: () => { publishId?: PublishId } | undefined
}

export function usePublishDialog(options: UsePublishDialogOptions) {
  const toast = useToast()
  const open = ref(false)

  watch(open, (isOpen) => {
    if (!isOpen) resetForm()
  })

  function resetForm() {
    options.state.value = options.createPublishForm()
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增出版社"
    options.editingPublishId.value = void 0
    options.submittingPublish.value = false
    options.loadingEditPublish.value = false
  }

  function openAddPublishModal() {
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增出版社"
    options.editingPublishId.value = void 0
    options.state.value = options.createPublishForm()
    open.value = true
  }

  async function openEditPublishModal(id: PublishId | undefined) {
    if (id === undefined || id === null) return
    options.editModalMode.value = "edit"
    options.editModalTitle.value = "修改出版社"
    options.editingPublishId.value = Number(id)
    const formData = await options.loadPublishForm(id)
    if (formData) {
      options.state.value = formData
      open.value = true
    }
  }

  function openEditPublishBySelection() {
    const row = options.getFirstSelectedRow()
    if (row?.publishId === undefined || row?.publishId === null) {
      toast.add({ title: "错误", description: "请选择需要修改的出版社", color: "error" })
      return
    }
    void openEditPublishModal(row.publishId)
  }

  return { open, openAddPublishModal, openEditPublishModal, openEditPublishBySelection }
}
