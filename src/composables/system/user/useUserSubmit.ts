import type {Ref} from "vue";
import UserAPI, {type UserForm} from "@/api/system/user-api";

type EditModalMode = "add" | "edit";

interface UseUserSubmitOptions {
  editModalMode: Ref<EditModalMode>
  editingUserId: Ref<string>
  assignRoleUserId: Ref<string>
  editUserState: Ref<UserForm>
  assignRoleState: Ref<UserForm>
  submittingEditUser: Ref<boolean>
  submittingAssignRole: Ref<boolean>
  openEditModal: Ref<boolean>
  openAssignRoleModal: Ref<boolean>
  fetchData: () => Promise<void>
  getAvatarFile: () => File | undefined
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function useUserSubmit(options: UseUserSubmitOptions) {
  const toast = useToast()

  async function submitEditUser() {
    if (options.editModalMode.value === "edit" && !options.editingUserId.value) {
      toast.add({title: "错误", description: "用户ID不能为空", color: "error"})
      return
    }
    if (!options.editUserState.value.nickname?.trim()) {
      toast.add({title: "错误", description: "昵称不能为空", color: "error"})
      return
    }
    if (!Array.isArray(options.editUserState.value.roleIds) || options.editUserState.value.roleIds.length === 0) {
      toast.add({title: "错误", description: "请至少选择一个角色", color: "error"})
      return
    }
    const payload: UserForm = {
      ...options.editUserState.value,
      id: options.editModalMode.value === "edit"
        ? Number(options.editingUserId.value)
        : Number(options.editUserState.value.id ?? 0),
      roleIds: Array.isArray(options.editUserState.value.roleIds)
        ? options.editUserState.value.roleIds.map(item => Number(item))
        : []
    }

    try {
      options.submittingEditUser.value = true
      const file = options.getAvatarFile()
      if (file) {
        payload.avatar = await fileToBase64(file)
      }
      if (options.editModalMode.value === "add") {
        await UserAPI.create(payload)
        toast.add({title: "成功", description: "新增成功", color: "success"})
      } else {
        await UserAPI.update(options.editingUserId.value, payload)
        toast.add({title: "成功", description: "修改成功", color: "success"})
      }
      options.openEditModal.value = false
      await options.fetchData()
    } catch {
      toast.add({
        title: "错误",
        description: options.editModalMode.value === "add" ? "新增失败" : "修改失败",
        color: "error"
      })
    } finally {
      options.submittingEditUser.value = false
    }
  }

  async function submitAssignRole() {
    if (!options.assignRoleUserId.value) {
      toast.add({title: "错误", description: "用户ID不能为空", color: "error"})
      return
    }
    const payload: UserForm = {
      ...options.assignRoleState.value,
      id: Number(options.assignRoleUserId.value),
      roleIds: Array.isArray(options.assignRoleState.value.roleIds)
        ? options.assignRoleState.value.roleIds.map(item => Number(item))
        : []
    }
    try {
      options.submittingAssignRole.value = true
      await UserAPI.update(options.assignRoleUserId.value, payload)
      toast.add({title: "成功", description: "分配角色成功", color: "success"})
      options.openAssignRoleModal.value = false
      await options.fetchData()
    } catch {
      toast.add({title: "错误", description: "分配角色失败", color: "error"})
    } finally {
      options.submittingAssignRole.value = false
    }
  }

  return {
    submitEditUser,
    submitAssignRole,
  }
}
