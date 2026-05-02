import { ref, watch, type Ref } from "vue"

interface UseRoleDialogOptions {
  submittingEditRole: Ref<boolean>
  loadingEditRole: Ref<boolean>
  editingRoleId: Ref<string>
  editModalMode: Ref<"add" | "edit">
  editModalTitle: Ref<string>
  loadingAssignUsers: Ref<boolean>
  submittingAssignUsers: Ref<boolean>
  assigningRoleId: Ref<string>
  assignUsersRoleId: Ref<string>
  assignUsersRoleName: Ref<string>
  assignUserIds: Ref<Array<string | number>>
  resetEditRoleForm: () => void
  loadRoleForm: (id: string | number | undefined) => Promise<void>
  fetchUserOptions: () => Promise<void>
  getFirstSelectedRow: () => { id?: string | number } | undefined
}

export function useRoleDialog(options: UseRoleDialogOptions) {
  const toast = useToast()
  const openEditModal = ref(false)
  const openAssignUsersModal = ref(false)

  watch(openEditModal, (isOpen) => {
    if (!isOpen) options.resetEditRoleForm()
  })

  watch(openAssignUsersModal, (isOpen) => {
    if (!isOpen) resetAssignUsersForm()
  })

  function openAddRoleModal() {
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增角色"
    options.editingRoleId.value = ""
    openEditModal.value = true
  }

  function openEditRoleModal(id: string | number | undefined) {
    void options.loadRoleForm(id).then(() => {
      openEditModal.value = true
    })
  }

  function openEditRoleBySelection() {
    const row = options.getFirstSelectedRow()
    if (row?.id === undefined || row?.id === null || row?.id === "") {
      toast.add({ title: "错误", description: "请选择需要修改的角色", color: "error" })
      return
    }
    openEditRoleModal(row.id)
  }

  async function openAssignUsersDialog(id: string | number | undefined, name?: string) {
    if (id === undefined || id === null || id === "") return
    options.assigningRoleId.value = String(id)
    options.loadingAssignUsers.value = true
    options.assignUsersRoleId.value = String(id)
    options.assignUsersRoleName.value = name ?? ""
    options.assignUserIds.value = []
    try {
      await options.fetchUserOptions()
      openAssignUsersModal.value = true
    } catch {
      toast.add({ title: "错误", description: "打开表单失败", color: "error" })
    } finally {
      options.loadingAssignUsers.value = false
      options.assigningRoleId.value = ""
    }
  }

  function resetAssignUsersForm() {
    options.assignUserIds.value = []
    options.assignUsersRoleId.value = ""
    options.assignUsersRoleName.value = ""
    options.submittingAssignUsers.value = false
    options.loadingAssignUsers.value = false
    options.assigningRoleId.value = ""
  }

  return { openEditModal, openAssignUsersModal, openAddRoleModal, openEditRoleModal, openEditRoleBySelection, openAssignUsersDialog, resetAssignUsersForm }
}
