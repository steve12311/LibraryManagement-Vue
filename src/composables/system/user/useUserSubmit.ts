import type {Ref} from "vue";
import UserAPI, {type UserForm} from "@/api/system/user-api";
import type { ModalEditMode } from "@/types/common";
import FileApi from "@/api/file-api";
import { MAX_AVATAR_SIZE_BYTES } from "@/constants/file-constants";

interface UseUserSubmitOptions {
  editModalMode: Ref<ModalEditMode>
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

/**
 * 用户编辑与角色分配提交逻辑。
 */
export function useUserSubmit(options: UseUserSubmitOptions) {
  const toast = useToast()

  /**
   * 提交用户新增/编辑。
   * 流程：校验（ID/昵称/角色）→ 构建 payload → 头像文件上传 → API（新增/修改）→ 刷新列表
   */
  async function submitEditUser() {
    // 编辑模式校验
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

    // 构建提交 payload
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
        if (!file.type.startsWith("image/")) {
          toast.add({title: "错误", description: "头像文件必须为图片格式", color: "error"})
          return
        }
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
          toast.add({title: "错误", description: "头像文件不能超过2MB", color: "error"})
          return
        }
        const result = await FileApi.uploadFile(file)
        payload.avatar = result.url
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

  /**
   * 提交角色分配。
   * 流程：校验角色ID → 构建 payload → API 更新 → 刷新列表
   */
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
      toast.add({title: "成功", description: "角色分配成功", color: "success"})
      options.openAssignRoleModal.value = false
      await options.fetchData()
    } catch {
      toast.add({title: "错误", description: "角色分配失败", color: "error"})
    } finally {
      options.submittingAssignRole.value = false
    }
  }

  return {
    submitEditUser,
    submitAssignRole,
  }
}
