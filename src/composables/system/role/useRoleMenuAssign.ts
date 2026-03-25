import {ref, type Ref} from "vue";
import MenuAPI from "@/api/system/menu-api";
import RoleAPI, {type RoleId} from "@/api/system/role-api";

interface UseRoleMenuAssignOptions {
  openAssignMenuModal: Ref<boolean>
  loadingAssignMenus: Ref<boolean>
  submittingAssignMenus: Ref<boolean>
  assigningMenuRoleId: Ref<string>
}

export interface RoleMenuOption extends OptionType {
  tag?: string
  avatar?: {
    src?: string
  }
  children?: RoleMenuOption[]
}

function normalizeMenuIds(menuIds: number[]) {
  return Array.from(new Set(
      menuIds
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0)
  ))
}

export function collectReplayCheckedMenuIds(menuTree: RoleMenuOption[], assignedMenuIds: number[]) {
  const assignedIdSet = new Set(normalizeMenuIds(assignedMenuIds))
  const replayCheckedMenuIds: Array<RoleMenuOption["value"]> = []

  const hasAssignedDescendant = (nodes: RoleMenuOption[]): boolean => {
    return nodes.some((node) => {
      const menuId = Number(node.value)
      if (Number.isInteger(menuId) && assignedIdSet.has(menuId)) {
        return true
      }
      if (node.children?.length) {
        return hasAssignedDescendant(node.children)
      }
      return false
    })
  }

  const walk = (nodes: RoleMenuOption[]) => {
    for (const node of nodes) {
      const menuId = Number(node.value)
      const children = node.children ?? []
      const hasChildren = children.length > 0
      const isAssigned = Number.isInteger(menuId) && assignedIdSet.has(menuId)

      if (!hasChildren) {
        if (isAssigned) {
          replayCheckedMenuIds.push(node.value)
        }
        continue
      }

      walk(children)

      const hasAssignedChild = hasAssignedDescendant(children)

      if (isAssigned && !hasAssignedChild) {
        replayCheckedMenuIds.push(node.value)
      }
    }
  }

  walk(menuTree)
  return Array.from(new Set(replayCheckedMenuIds))
}

export function useRoleMenuAssign(options: UseRoleMenuAssignOptions) {
  const toast = useToast()
  const assignMenuRoleId = ref("")
  const assignMenuRoleName = ref("")
  const menuTreeOptions = ref<RoleMenuOption[]>([])
  const assignedMenuIds = ref<number[]>([])

  function resetAssignMenuForm() {
    assignMenuRoleId.value = ""
    assignMenuRoleName.value = ""
    menuTreeOptions.value = []
    assignedMenuIds.value = []
    options.loadingAssignMenus.value = false
    options.submittingAssignMenus.value = false
    options.assigningMenuRoleId.value = ""
  }

  async function openAssignMenuDialog(roleId: RoleId | undefined, roleName?: string) {
    if (roleId === undefined || roleId === null || roleId === "") return
    options.assigningMenuRoleId.value = String(roleId)
    options.loadingAssignMenus.value = true
    assignMenuRoleId.value = String(roleId)
    assignMenuRoleName.value = roleName?.trim() ?? ""
    assignedMenuIds.value = []
    try {
      const [menuTree, menuIds] = await Promise.all([
        MenuAPI.getOptions(),
        RoleAPI.getRoleMenuIds(roleId),
      ])
      menuTreeOptions.value = menuTree ?? []
      assignedMenuIds.value = normalizeMenuIds(menuIds ?? [])
      options.openAssignMenuModal.value = true
    } catch {
      toast.add({title: "错误", description: "加载角色菜单权限失败", color: "error"})
    } finally {
      options.loadingAssignMenus.value = false
      options.assigningMenuRoleId.value = ""
    }
  }

  async function submitAssignMenus(menuIds: number[]) {
    if (!assignMenuRoleId.value) {
      toast.add({title: "错误", description: "角色ID不能为空", color: "error"})
      return
    }

    try {
      options.submittingAssignMenus.value = true
      await RoleAPI.assignMenusToRole(Number(assignMenuRoleId.value), normalizeMenuIds(menuIds))
      toast.add({title: "成功", description: "分配菜单权限成功", color: "success"})
      options.openAssignMenuModal.value = false
    } catch {
      toast.add({title: "错误", description: "分配菜单权限失败", color: "error"})
    } finally {
      options.submittingAssignMenus.value = false
    }
  }

  return {
    assignMenuRoleId,
    assignMenuRoleName,
    menuTreeOptions,
    assignedMenuIds,
    resetAssignMenuForm,
    openAssignMenuDialog,
    submitAssignMenus,
  }
}
