import { type Ref } from "vue"
import type { RoleForm, RoleId, RoleStatus } from "@/api/system/role-api"
import RoleAPI from "@/api/system/role-api"
import { ElMessageBox } from "element-plus"
import { StatusTypeEnum, SYSTEM_ROOT_ROLE_ID } from "@/enums/system/status-enum"

interface UseRoleActionsOptions {
  roleState: Ref<RoleForm>
  openEditModal: Ref<boolean>
  editModalMode: Ref<"add" | "edit">
  editingRoleId: Ref<string>
  submittingEditRole: Ref<boolean>
  submittingAssignUsers: Ref<boolean>
  deletingRoleId: Ref<string>
  roleStatusUpdatingId: Ref<string>
  assignUsersRoleId: Ref<string>
  assignUserIds: Ref<Array<string | number>>
  normalizeRolePayload: (raw: RoleForm, overrideId?: RoleId) => RoleForm
  fetchData: () => Promise<void>
  getSelectedRows: () => { original: { id?: string | number; name?: string } }[]
}

export function useRoleActions(options: UseRoleActionsOptions) {
  const toast = useToast()

  function isRootRole(roleId: RoleId | undefined) {
    return Number(roleId) === SYSTEM_ROOT_ROLE_ID
  }

  async function submitEditRole() {
    const payload = options.normalizeRolePayload(
      options.roleState.value,
      options.editModalMode.value === "edit" ? options.editingRoleId.value : undefined,
    )
    if (!payload.name) {
      toast.add({ title: "错误", description: "角色名称不能为空", color: "error" })
      return
    }
    if (!payload.code) {
      toast.add({ title: "错误", description: "权限字符不能为空", color: "error" })
      return
    }
    try {
      options.submittingEditRole.value = true
      if (options.editModalMode.value === "add") {
        await RoleAPI.create(payload)
        toast.add({ title: "成功", description: "新增成功", color: "success" })
      } else {
        await RoleAPI.update(Number(options.editingRoleId.value), payload)
        toast.add({ title: "成功", description: "修改成功", color: "success" })
      }
      options.openEditModal.value = false
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "保存失败", color: "error" })
    } finally {
      options.submittingEditRole.value = false
    }
  }

  async function submitAssignUsers() {
    if (!options.assignUsersRoleId.value) {
      toast.add({ title: "错误", description: "角色ID不能为空", color: "error" })
      return
    }
    const userIds = options.assignUserIds.value
      .map(item => Number(item))
      .filter(item => !Number.isNaN(item))
    if (!userIds.length) {
      toast.add({ title: "错误", description: "请选择要分配的用户", color: "error" })
      return
    }
    try {
      options.submittingAssignUsers.value = true
      await RoleAPI.assignUsersToRole(Number(options.assignUsersRoleId.value), userIds)
      toast.add({ title: "成功", description: "分配用户成功", color: "success" })
    } catch {
      toast.add({ title: "错误", description: "分配用户失败", color: "error" })
    } finally {
      options.submittingAssignUsers.value = false
    }
  }

  async function confirmDeleteRoles(ids: RoleId[], names: string[] = []) {
    if (!ids.length) return
    const nameText = names[0]?.trim()
    const content = ids.length === 1
      ? `确定删除角色 ${nameText || ids[0]} 吗？`
      : `确定删除选中的 ${ids.length} 个角色吗？`
    try {
      await ElMessageBox.confirm(content, "删除角色", { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" })
      options.deletingRoleId.value = ids.length === 1 ? String(ids[0]) : "__batch__"
      await RoleAPI.delete(ids)
      toast.add({ title: "成功", description: "删除成功", color: "success" })
      await options.fetchData()
    } catch (e: unknown) {
      if (e === "cancel" || e === "close") return
    } finally {
      options.deletingRoleId.value = ""
    }
  }

  function deleteRoleBySelection() {
    const selectedRows = options.getSelectedRows()
    if (!selectedRows.length) {
      toast.add({ title: "错误", description: "请选择需要删除的角色", color: "error" })
      return
    }
    const deleteRoles = selectedRows
      .map((row: { original: { id?: string | number; name?: string } }) => row.original)
      .filter(item => item.id && !isRootRole(item.id))
    if (!deleteRoles.length) {
      toast.add({ title: "错误", description: "超级管理员不可删除", color: "error" })
      return
    }
    const ids = deleteRoles.map(item => item.id as RoleId)
    const names = deleteRoles.map(item => item.name ?? "")
    confirmDeleteRoles(ids, names)
  }

  async function updateRoleStatus(roleId: RoleId | undefined, value: boolean) {
    if (roleId === undefined || roleId === null || roleId === "") return
    if (isRootRole(roleId)) {
      toast.add({ title: "错误", description: "ROOT角色不可禁用", color: "error" })
      await options.fetchData()
      return
    }
    const status = (value ? StatusTypeEnum.ACCESS : StatusTypeEnum.BAN) as RoleStatus
    try {
      options.roleStatusUpdatingId.value = String(roleId)
      await RoleAPI.updateRoleStatus(roleId, status)
      toast.add({ title: "成功", description: "状态已更新", color: "success" })
      await options.fetchData()
    } catch {
      toast.add({ title: "错误", description: "更新失败", color: "error" })
    } finally {
      options.roleStatusUpdatingId.value = ""
    }
  }

  return { isRootRole, submitEditRole, submitAssignUsers, confirmDeleteRoles, deleteRoleBySelection, updateRoleStatus }
}
