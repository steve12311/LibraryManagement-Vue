import { ref, type Ref } from "vue"
import type { SelectMenuItem } from "@nuxt/ui"
import RoleAPI, { type RoleForm, type RoleId } from "@/api/system/role-api"
import UserAPI from "@/api/system/user-api"
import { DataScopeTypeEnum, StatusTypeEnum } from "@/enums/system/status-enum"
import { createStatusOptions } from "@/utils/option-items"

const initialRoleFormData: RoleForm = {
  id: 0,
  name: "",
  code: "",
  sort: 1,
  status: StatusTypeEnum.ACCESS,
  dataScope: DataScopeTypeEnum.ALL as RoleForm["dataScope"],
}

const statusOptions = createStatusOptions()

const dataScopeOptions = [
  { label: "全部数据", value: DataScopeTypeEnum.ALL },
  { label: "本部门及子部门", value: DataScopeTypeEnum.DEPARTMENT_AND_CHILD },
  { label: "本部门", value: DataScopeTypeEnum.DEPARTMENT },
  { label: "仅本人", value: DataScopeTypeEnum.OWNER },
]

interface UseRoleFormOptions {
  submittingEditRole: Ref<boolean>
  loadingEditRole: Ref<boolean>
  editingRoleId: Ref<string>
  editModalMode: Ref<"add" | "edit">
  editModalTitle: Ref<string>
}

export function useRoleForm(options: UseRoleFormOptions) {
  const toast = useToast()
  const roleState = ref<RoleForm>({ ...initialRoleFormData })
  const userOptions = ref<SelectMenuItem[]>([])

  function normalizeUserOptions(items: SelectMenuItem[]) {
    return items.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const avatarValue = (item as SelectMenuItem & { avatar?: unknown }).avatar
        if (typeof avatarValue === "string") {
          return { ...item, avatar: { src: avatarValue } }
        }
      }
      return item
    })
  }

  function normalizeRolePayload(raw: RoleForm, overrideId?: RoleId): RoleForm {
    return {
      ...raw,
      id: overrideId === undefined ? Number(raw.id ?? 0) : Number(overrideId),
      name: raw.name?.trim() ?? "",
      code: raw.code?.trim() ?? "",
      sort: Number(raw.sort ?? 0),
      status: Number(raw.status ?? StatusTypeEnum.ACCESS) as RoleForm["status"],
      dataScope: Number(raw.dataScope ?? DataScopeTypeEnum.ALL) as RoleForm["dataScope"],
    }
  }

  function resetEditRoleForm() {
    roleState.value = { ...initialRoleFormData }
    options.submittingEditRole.value = false
    options.loadingEditRole.value = false
    options.editingRoleId.value = ""
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增角色"
  }

  async function fetchUserOptions() {
    try {
      const opts = await UserAPI.getOptions()
      userOptions.value = normalizeUserOptions(opts ?? [])
    } catch {
      toast.add({ title: "错误", description: "数据加载失败", color: "error" })
    }
  }

  async function loadRoleForm(id: string | number | undefined) {
    if (id === undefined || id === null || id === "") return
    options.loadingEditRole.value = true
    options.editingRoleId.value = String(id)
    options.editModalMode.value = "edit"
    options.editModalTitle.value = "修改角色"
    try {
      const formData = await RoleAPI.getRoleForm(id)
      roleState.value = normalizeRolePayload({ ...initialRoleFormData, ...formData }, formData.id ?? id)
    } catch {
      toast.add({ title: "错误", description: "数据加载失败", color: "error" })
    } finally {
      options.loadingEditRole.value = false
    }
  }

  return { initialRoleFormData, roleState, statusOptions, dataScopeOptions, userOptions, normalizeRolePayload, resetEditRoleForm, fetchUserOptions, loadRoleForm }
}
