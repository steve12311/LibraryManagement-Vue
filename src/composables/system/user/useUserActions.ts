import type {Ref} from "vue";
import {ElMessageBox} from "element-plus";
import UserAPI, {type UserPageVO} from "@/api/system/user-api";
import {StatusTypeEnum} from "@/enums/system/status-enum";

type SelectedUserRow = {
  original: UserPageVO
}

type TableLike = {
  tableApi?: {
    getFilteredSelectedRowModel: () => {
      flatRows?: SelectedUserRow[]
    }
  }
}

interface UseUserActionsOptions {
  table: Readonly<Ref<TableLike | null | undefined>>
  openEditUserModal: (id: string | number) => void | Promise<void>
  fetchData: () => Promise<void>
  resettingUserId: Ref<string>
  deletingUserId: Ref<string>
  togglingStatusUserId: Ref<string>
  currentUserId?: Readonly<Ref<string | number | undefined>>
  currentUsername?: Readonly<Ref<string | undefined>>
}

type UserStatusTarget = Pick<UserPageVO, "id" | "username"> | string | number | undefined

/** 用户操作：编辑、重置密码、删除、状态切换 */
export function useUserActions(options: UseUserActionsOptions) {
  const toast = useToast()

  function normalizeIdentity(value: unknown) {
    return String(value ?? "").trim()
  }

  function resolveUserId(user: UserStatusTarget) {
    return typeof user === "object" && user !== null ? user.id : user
  }

  function isCurrentUser(user: UserStatusTarget) {
    const currentUserId = normalizeIdentity(options.currentUserId?.value)
    const currentUsername = normalizeIdentity(options.currentUsername?.value)

    if (typeof user === "object" && user !== null) {
      const userId = normalizeIdentity(user.id)
      const username = normalizeIdentity(user.username)
      return Boolean(
        (currentUserId && userId && currentUserId === userId)
        || (currentUsername && username && currentUsername === username)
      )
    }

    const userId = normalizeIdentity(user)
    return Boolean(currentUserId && userId && currentUserId === userId)
  }

  function openEditUserModalBySelection() {
    const selectedRow = options.table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original
    if (!selectedRow?.id) {
      toast.add({title: "错误", description: "请选择需要修改的用户", color: "error"})
      return
    }
    void options.openEditUserModal(selectedRow.id)
  }

  async function confirmResetPassword(id: string | number, username?: string) {
    if (!id && id !== 0) return
    try {
      await ElMessageBox.confirm(
        `确定重置用户 ${username ? `${username}` : ""} 的密码吗？`,
        "重置密码",
        {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消"
        }
      )
      options.resettingUserId.value = String(id)
      await UserAPI.resetPassword(id)
      toast.add({title: "成功", description: "密码已重置为默认密码 123456", color: "success"})
    } catch (e: unknown) {
      if (e === "cancel" || e === "close") {
        return
      }
    } finally {
      options.resettingUserId.value = ""
    }
  }

  async function confirmDeleteUsers(ids: Array<string | number>, usernames: string[] = []) {
    if (!ids.length) return
    const usernameText = usernames[0]?.trim()
    const content = ids.length === 1
      ? `确定删除用户 ${usernameText || ids[0]} 吗？`
      : `确定删除选中的 ${ids.length} 个用户吗？`
    try {
      await ElMessageBox.confirm(
        content,
        "删除用户",
        {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消"
        }
      )
      options.deletingUserId.value = ids.length === 1 ? String(ids[0] ?? "") : "__batch__"
      await UserAPI.delete(ids)
      toast.add({title: "成功", description: "删除成功", color: "success"})
      await options.fetchData()
    } catch (e: unknown) {
      if (e === "cancel" || e === "close") {
        return
      }
    } finally {
      options.deletingUserId.value = ""
    }
  }

  async function updateUserStatus(user: UserStatusTarget, value: boolean) {
    const userId = resolveUserId(user)
    if (userId === undefined || userId === null || userId === "") return
    if (isCurrentUser(user)) {
      toast.add({title: "错误", description: "不能禁用当前登录用户", color: "error"})
      await options.fetchData()
      return
    }
    try {
      options.togglingStatusUserId.value = String(userId)
      const status = value ? StatusTypeEnum.ACCESS : StatusTypeEnum.BAN
      await UserAPI.changeStatus(userId, status)
      toast.add({title: "成功", description: "状态已更新", color: "success"})
      await options.fetchData()
    } catch {
      toast.add({title: "错误", description: "状态更新失败", color: "error"})
    } finally {
      options.togglingStatusUserId.value = ""
    }
  }

  function deleteUserBySelection() {
    const selectedRows = options.table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
    if (!selectedRows.length) {
      toast.add({title: "错误", description: "请选择需要删除的用户", color: "error"})
      return
    }
    const deleteUsers = selectedRows
      .map((row) => row.original)
      .filter((item) => item.id && Number(item.id) !== 1)
    if (!deleteUsers.length) {
      toast.add({title: "错误", description: "超级管理员不可删除", color: "error"})
      return
    }
    const ids = deleteUsers.map((item) => item.id)
    const usernames = deleteUsers.map((item) => item.username ?? "")
    void confirmDeleteUsers(ids, usernames)
  }

  return {
    openEditUserModalBySelection,
    confirmResetPassword,
    confirmDeleteUsers,
    updateUserStatus,
    deleteUserBySelection,
    isCurrentUser,
  }
}
