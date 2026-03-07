import type {Ref} from "vue";
import {ElMessageBox} from "element-plus";
import UserAPI, {type UserPageVO} from "@/api/system/user-api";

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
}

export function useUserActions(options: UseUserActionsOptions) {
  const toast = useToast()

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

  return {
    openEditUserModalBySelection,
    confirmResetPassword,
    confirmDeleteUsers,
  }
}
