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

/**
 * 从菜单树 + 已分配菜单ID列表中，反向推算出需要回填选中状态的节点。
 * 规则：
 * - 叶子节点：已分配即选中
 * - 非叶子节点：仅当自身已分配且无任何子节点被分配时才选中
 *   （避免父节点选中导致子节点被连带勾选）
 */
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

      // 叶子节点：已分配即选中
      if (!hasChildren) {
        if (isAssigned) replayCheckedMenuIds.push(node.value)
        continue
      }

      // 非叶子节点：先递归子节点，再判断自身
      walk(children)

      const hasAssignedChild = hasAssignedDescendant(children)

      // 自身已分配但无子节点被分配 → 选中自身
      if (isAssigned && !hasAssignedChild) {
        replayCheckedMenuIds.push(node.value)
      }
    }
  }

  walk(menuTree)
  return Array.from(new Set(replayCheckedMenuIds))
}

/**
 * 角色菜单权限分配逻辑。
 * openAssignMenuDialog 并发拉取菜单树 + 已分配菜单ID，
 * submitAssignMenus 提交选中的菜单ID列表。
 */
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

  /** 打开分配菜单弹窗：并发拉取菜单树 + 已分配菜单ID */
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
      toast.add({title: "错误", description: "数据加载失败", color: "error"})
    } finally {
      options.loadingAssignMenus.value = false
      options.assigningMenuRoleId.value = ""
    }
  }

  /** 提交菜单权限分配 */
  async function submitAssignMenus(menuIds: number[]) {
    if (!assignMenuRoleId.value) {
      toast.add({title: "错误", description: "角色ID不能为空", color: "error"})
      return
    }

    try {
      options.submittingAssignMenus.value = true
      await RoleAPI.assignMenusToRole(Number(assignMenuRoleId.value), normalizeMenuIds(menuIds))
      toast.add({title: "成功", description: "菜单分配成功", color: "success"})
      options.openAssignMenuModal.value = false
    } catch {
      toast.add({title: "错误", description: "菜单分配失败", color: "error"})
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
