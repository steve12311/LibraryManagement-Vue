import type {Ref} from "vue";
import UserAPI, {type UserForm} from "@/api/system/user-api";

type EditModalMode = "add" | "edit";

interface UseUserDialogOptions {
  openEditModal: Ref<boolean>
  openAssignRoleModal: Ref<boolean>
  editModalMode: Ref<EditModalMode>
  editModalTitle: Ref<string>
  loadingEditUser: Ref<boolean>
  loadingAssignRole: Ref<boolean>
  assigningRoleUserId: Ref<string>
  editingUserId: Ref<string>
  assignRoleUserId: Ref<string>
  assignRoleUsername: Ref<string>
  avatarModel: Ref<File | undefined>
  initialUserFormData: UserForm
  editUserState: Ref<UserForm>
  assignRoleState: Ref<UserForm>
  fetchRoleOptions: () => Promise<void>
}

export function useUserDialog(options: UseUserDialogOptions) {
  const toast = useToast()

  async function openEditUserModal(id: string | number) {
    if (!id && id !== 0) return
    options.loadingEditUser.value = true
    options.editingUserId.value = String(id)
    options.editModalMode.value = "edit"
    options.editModalTitle.value = "修改用户信息"
    try {
      const [formData] = await Promise.all([
        UserAPI.getFormData(id),
        options.fetchRoleOptions()
      ])
      options.editUserState.value = {
        ...options.initialUserFormData,
        ...formData,
        id: Number(formData.id ?? id),
        roleIds: Array.isArray(formData.roleIds) ? formData.roleIds.map(item => Number(item)) : []
      }
      options.avatarModel.value = void 0
      options.openEditModal.value = true
    } catch {
      toast.add({title: "错误", description: "加载用户信息失败", color: "error"})
    } finally {
      options.loadingEditUser.value = false
    }
  }

  async function openAddUserModal() {
    options.editingUserId.value = ""
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增用户"
    options.editUserState.value = {...options.initialUserFormData}
    options.avatarModel.value = void 0
    await options.fetchRoleOptions()
    options.openEditModal.value = true
  }

  async function openAssignRoleDialog(id: string | number, username?: string) {
    if (!id && id !== 0) return
    options.assigningRoleUserId.value = String(id)
    options.loadingAssignRole.value = true
    options.assignRoleUserId.value = String(id)
    options.assignRoleUsername.value = username ?? ""
    try {
      const [formData] = await Promise.all([
        UserAPI.getFormData(id),
        options.fetchRoleOptions()
      ])
      options.assignRoleState.value = {
        ...options.initialUserFormData,
        ...formData,
        id: Number(formData.id ?? id),
        roleIds: Array.isArray(formData.roleIds) ? formData.roleIds.map(item => Number(item)) : []
      }
      options.openAssignRoleModal.value = true
    } catch {
      toast.add({title: "错误", description: "加载角色分配信息失败", color: "error"})
    } finally {
      options.loadingAssignRole.value = false
      options.assigningRoleUserId.value = ""
    }
  }

  return {
    openEditUserModal,
    openAddUserModal,
    openAssignRoleDialog,
  }
}
