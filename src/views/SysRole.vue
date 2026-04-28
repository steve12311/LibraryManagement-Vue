<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import type {SelectMenuItem, TableColumn} from "@nuxt/ui";
import moment from "moment";
import {ElMessageBox} from "element-plus";
import UserAPI from "@/api/system/user-api.ts";
import RoleAPI, {
  type RoleForm,
  type RoleId,
  type RolePageQuery,
  type RolePageVO,
  type RoleStatus
} from "@/api/system/role-api.ts";
import {DataScopeTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum.ts";
import {useRoleMenuAssign} from "@/composables/system/role/useRoleMenuAssign";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";
import RoleEditModal from "@/components/system/role/RoleEditModal.vue";
import RoleAssignUsersModal from "@/components/system/role/RoleAssignUsersModal.vue";
import RoleAssignMenusModal from "@/components/system/role/RoleAssignMenusModal.vue";

onMounted(() => {
  handleQuery()
})

const UCheckbox = resolveComponent('UCheckbox')
const USwitch = resolveComponent('USwitch')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const toast = useToast()
const table = useTemplateRef("table")
const columnVisibility = ref({
  id: false,
})
const total = ref(0);
const queryParams = reactive<RolePageQuery>({
  pageNum: 1,
  pageSize: 10,
});
const searchForm = reactive({
  keywords: "",
})
const roleList = shallowRef<RolePageVO[]>([])
const openEditModal = ref(false)
const openAssignUsersModal = ref(false)
const openAssignMenuModal = ref(false)
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增角色")
const loadingPageData = ref(false)
const loadingEditRole = ref(false)
const submittingEditRole = ref(false)
const loadingAssignUsers = ref(false)
const submittingAssignUsers = ref(false)
const loadingAssignMenus = ref(false)
const submittingAssignMenus = ref(false)
const editingRoleId = ref("")
const assigningRoleId = ref("")
const assigningMenuRoleId = ref("")
const deletingRoleId = ref("")
const roleStatusUpdatingId = ref("")
const assignUsersRoleId = ref("")
const assignUsersRoleName = ref("")
const userOptions = ref<SelectMenuItem[]>([])
const assignUserIds = ref<Array<string | number>>([])
const statusOptions = ref<OptionType[]>([
  {
    label: "启用",
    value: StatusTypeEnum.ACCESS
  },
  {
    label: "禁用",
    value: StatusTypeEnum.BAN
  }
])
const dataScopeOptions = ref<OptionType[]>([
  {
    label: "全部数据",
    value: DataScopeTypeEnum.ALL
  },
  {
    label: "本部门及子部门",
    value: DataScopeTypeEnum.DEPARTMENT_AND_CHILD
  },
  {
    label: "本部门",
    value: DataScopeTypeEnum.DEPARTMENT
  },
  {
    label: "仅本人",
    value: DataScopeTypeEnum.OWNER
  }
])
const initialRoleFormData: RoleForm = {
  id: 0,
  name: "",
  code: "",
  sort: 1,
  status: StatusTypeEnum.ACCESS,
  dataScope: DataScopeTypeEnum.ALL as RoleForm["dataScope"]
}
const roleState = ref<RoleForm>({...initialRoleFormData})
const {
  assignMenuRoleName,
  menuTreeOptions,
  assignedMenuIds,
  resetAssignMenuForm,
  openAssignMenuDialog,
  submitAssignMenus,
} = useRoleMenuAssign({
  openAssignMenuModal,
  loadingAssignMenus,
  submittingAssignMenus,
  assigningMenuRoleId,
})
const columns = ref<TableColumn<RolePageVO>[]>([
  {
    id: "select",
    header: ({table}) => {
      return h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
        'aria-label': '选择全部'
      })
    },
    cell: ({row}) => {
      return h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': '选择单行'
      })
    }
  },
  {
    id: "id",
    accessorKey: "id",
    header: "角色ID",
  },
  {
    id: "name",
    accessorKey: "name",
    header: "角色名称",
  },
  {
    id: "code",
    accessorKey: "code",
    header: "权限字符",
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({row}) => {
      return h(USwitch, {
        modelValue: row.original.status === StatusTypeEnum.ACCESS,
        disabled: roleStatusUpdatingId.value === String(row.original.id),
        "onUpdate:modelValue": (value: boolean) => {
          updateRoleStatus(row.original.id, value)
        }
      }, undefined)
    }
  },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  },
  {
    id: "action",
    accessorKey: "userId",
    header: "操作",
    cell: ({row}) => {
      if (Number(row.original.id) === 1) {
        return h('div', undefined, undefined);
      }
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-clipboard-pen-line",
            variant: "ghost",
            loading: loadingEditRole.value && editingRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openEditRoleModal(row.original.id)
            }
          }),
        ]),
        h(UTooltip, {text: "分配菜单", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-shield-check",
            variant: "ghost",
            loading: loadingAssignMenus.value && assigningMenuRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openAssignMenuDialog(row.original.id, row.original.name)
            }
          }),
        ]),
        h(UTooltip, {text: "分配用户", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-user",
            variant: "ghost",
            loading: loadingAssignUsers.value && assigningRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openAssignUsersDialog(row.original.id, row.original.name)
            }
          }),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-trash-2",
            variant: "ghost",
            loading: deletingRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              confirmDeleteRoles([row.original.id!], row.original.name ? [row.original.name] : [])
            }
          }),
        ])
      ])
    }
  }
])
watch(openEditModal, (isOpen) => {
  if (!isOpen) {
    resetEditRoleForm()
  }
})
watch(openAssignUsersModal, (isOpen) => {
  if (!isOpen) {
    resetAssignUsersForm()
  }
})
watch(openAssignMenuModal, (isOpen) => {
  if (!isOpen) {
    resetAssignMenuForm()
  }
})

function normalizeUserOptions(items: SelectMenuItem[]) {
  return items.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const avatarValue = (item as SelectMenuItem & { avatar?: unknown }).avatar
      if (typeof avatarValue === "string") {
        return {
          ...item,
          avatar: {
            src: avatarValue
          }
        }
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
    status: Number(raw.status ?? StatusTypeEnum.ACCESS) as RoleStatus,
    dataScope: Number(raw.dataScope ?? DataScopeTypeEnum.ALL) as RoleForm["dataScope"],
  }
}

function applySearchParams() {
  const keywords = searchForm.keywords.trim()
  queryParams.keywords = keywords || undefined
}

function resetEditRoleForm() {
  roleState.value = {...initialRoleFormData}
  submittingEditRole.value = false
  loadingEditRole.value = false
  editingRoleId.value = ""
  editModalMode.value = "add"
  editModalTitle.value = "新增角色"
}

function resetAssignUsersForm() {
  assignUserIds.value = []
  assignUsersRoleId.value = ""
  assignUsersRoleName.value = ""
  submittingAssignUsers.value = false
  loadingAssignUsers.value = false
  assigningRoleId.value = ""
}

async function fetchUserOptions() {
  try {
    const options = await UserAPI.getOptions()
    userOptions.value = normalizeUserOptions(options ?? [])
  } catch {
    toast.add({title: "错误", description: "获取用户列表失败", color: "error"})
  }
}

function openAddRoleModal() {
  editModalMode.value = "add"
  editModalTitle.value = "新增角色"
  editingRoleId.value = ""
  roleState.value = {...initialRoleFormData}
  openEditModal.value = true
}

async function openEditRoleModal(id: string | number | undefined) {
  if (id === undefined || id === null || id === "") return
  loadingEditRole.value = true
  editingRoleId.value = String(id)
  editModalMode.value = "edit"
  editModalTitle.value = "修改角色"
  try {
    const formData = await RoleAPI.getRoleForm(id)
    roleState.value = normalizeRolePayload({
      ...initialRoleFormData,
      ...formData
    }, formData.id ?? id)
    openEditModal.value = true
  } catch {
    toast.add({title: "错误", description: "获取角色信息失败", color: "error"})
  } finally {
    loadingEditRole.value = false
  }
}

function openEditRoleBySelection() {
  const selectedRow = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original
  if (selectedRow?.id === undefined || selectedRow?.id === null || selectedRow?.id === "") {
    toast.add({title: "错误", description: "请选择需要修改的角色", color: "error"})
    return
  }
  openEditRoleModal(selectedRow.id)
}

/** 提交角色新增/编辑：校验名称 → 构建 payload → API 调用（新增/修改）→ 刷新列表 */
async function submitEditRole() {
  const payload = normalizeRolePayload(
      roleState.value,
      editModalMode.value === "edit" ? editingRoleId.value : undefined
  )

  if (!payload.name) {
    toast.add({title: "错误", description: "角色名称不能为空", color: "error"})
    return
  }
  if (!payload.code) {
    toast.add({title: "错误", description: "权限字符不能为空", color: "error"})
    return
  }

  try {
    submittingEditRole.value = true
    if (editModalMode.value === "add") {
      await RoleAPI.create(payload)
      toast.add({title: "成功", description: "新增成功", color: "success"})
    } else {
      await RoleAPI.update(Number(editingRoleId.value), payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
    }
    openEditModal.value = false
    await fetchData()
  } catch {
    toast.add({title: "错误", description: "保存角色失败", color: "error"})
  } finally {
    submittingEditRole.value = false
  }
}

async function openAssignUsersDialog(id: string | number | undefined, name?: string) {
  if (id === undefined || id === null || id === "") return
  assigningRoleId.value = String(id)
  loadingAssignUsers.value = true
  assignUsersRoleId.value = String(id)
  assignUsersRoleName.value = name ?? ""
  assignUserIds.value = []
  try {
    await fetchUserOptions()
    openAssignUsersModal.value = true
  } catch {
    toast.add({title: "错误", description: "打开分配用户失败", color: "error"})
  } finally {
    loadingAssignUsers.value = false
    assigningRoleId.value = ""
  }
}

/** 提交角色分配用户：收集选中用户ID → API 分配 → 刷新列表 */
async function submitAssignUsers() {
  if (!assignUsersRoleId.value) {
    toast.add({title: "错误", description: "角色ID不能为空", color: "error"})
    return
  }
  const userIds = assignUserIds.value
      .map(item => Number(item))
      .filter(item => !Number.isNaN(item))

  if (!userIds.length) {
    toast.add({title: "错误", description: "请选择要分配的用户", color: "error"})
    return
  }

  try {
    submittingAssignUsers.value = true
    await RoleAPI.assignUsersToRole(Number(assignUsersRoleId.value), userIds)
    toast.add({title: "成功", description: "分配用户成功", color: "success"})
    openAssignUsersModal.value = false
  } catch {
    toast.add({title: "错误", description: "分配用户失败", color: "error"})
  } finally {
    submittingAssignUsers.value = false
  }
}

/** 批量删除角色：确认弹窗 → API 删除 → 刷新列表 */
async function confirmDeleteRoles(ids: RoleId[], names: string[] = []) {
  if (!ids.length) return
  const nameText = names[0]?.trim()
  const content = ids.length === 1
      ? `确定删除角色 ${nameText || ids[0]} 吗？`
      : `确定删除选中的 ${ids.length} 个角色吗？`
  try {
    await ElMessageBox.confirm(
        content,
        "删除角色",
        {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消"
        }
    )
    deletingRoleId.value = ids.length === 1 ? String(ids[0]) : "__batch__"
    await RoleAPI.delete(ids)
    toast.add({title: "成功", description: "删除成功", color: "success"})
    await fetchData()
  } catch (e: unknown) {
    if (e === "cancel" || e === "close") {
      return
    }
  } finally {
    deletingRoleId.value = ""
  }
}

function deleteRoleBySelection() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
  if (!selectedRows.length) {
    toast.add({title: "错误", description: "请选择需要删除的角色", color: "error"})
    return
  }
  const deleteRoles = selectedRows
      .map(row => row.original)
      .filter(item => item.id && Number(item.id) !== 1)
  if (!deleteRoles.length) {
    toast.add({title: "错误", description: "超级管理员不可删除", color: "error"})
    return
  }
  const ids = deleteRoles.map(item => item.id as RoleId)
  const names = deleteRoles.map(item => item.name ?? "")
  confirmDeleteRoles(ids, names)
}

async function updateRoleStatus(roleId: RoleId | undefined, value: boolean) {
  if (roleId === undefined || roleId === null || roleId === "") return
  const status = (value ? StatusTypeEnum.ACCESS : StatusTypeEnum.BAN) as RoleStatus
  try {
    roleStatusUpdatingId.value = String(roleId)
    await RoleAPI.updateRoleStatus(roleId, status)
    toast.add({title: "成功", description: "状态已更新", color: "success"})
    await fetchData()
  } catch {
    toast.add({title: "错误", description: "更新角色状态失败", color: "error"})
  } finally {
    roleStatusUpdatingId.value = ""
  }
}
async function fetchData() {
  try {
    loadingPageData.value = true
    const data = await RoleAPI.getPage(queryParams)
    roleList.value = data.list ?? [];
    total.value = data.total ?? 0;
  } catch {
    toast.add({title: "错误", description: "获取角色列表失败", color: "error"})
  } finally {
    loadingPageData.value = false
  }
}
function handleQuery() {
  queryParams.pageNum = 1;
  applySearchParams()
  fetchData();
}

function resetQuery() {
  searchForm.keywords = ""
  handleQuery()
}

async function submitAssignMenusForm(menuIds: number[]) {
  await submitAssignMenus(menuIds)
}
</script>

<template>
  <RoleAssignMenusModal
      :open="openAssignMenuModal"
      :role-name="assignMenuRoleName"
      :menu-tree-options="menuTreeOptions"
      :assigned-menu-ids="assignedMenuIds"
      :submitting="submittingAssignMenus"
      @update:open="openAssignMenuModal = $event"
      @submit="submitAssignMenusForm"
  />
  <RoleAssignUsersModal
      :open="openAssignUsersModal"
      :role-name="assignUsersRoleName"
      :user-options="userOptions"
      :user-ids="assignUserIds"
      :loading="loadingAssignUsers"
      :submitting="submittingAssignUsers"
      @update:open="openAssignUsersModal = $event"
      @update:user-ids="assignUserIds = $event"
      @submit="submitAssignUsers"
  />
  <RoleEditModal
      :open="openEditModal"
      :title="editModalTitle"
      :state="roleState"
      :status-options="statusOptions"
      :data-scope-options="dataScopeOptions"
      :submitting="submittingEditRole"
      @update:open="openEditModal = $event"
      @update:state="roleState = $event"
      @submit="submitEditRole"
  />
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="ROLE CONTROL"
          title="角色管理"
          description="统一维护角色资料、菜单授权与用户分配关系。"
          :stats="[
            { label: '角色总数', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '每页条数', value: queryParams.pageSize }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="table" @flush="handleQuery" @add-row="openAddRoleModal"
                       @modify-row="openEditRoleBySelection" @delete-row="deleteRoleBySelection"/>
        </template>
        <UForm @submit="handleQuery" class="w-full">
          <div class="system-query-row">
            <UInput
                v-model="searchForm.keywords"
                icon="i-lucide-search"
                size="md"
                variant="outline"
                class="w-72"
                placeholder="搜索角色名称/权限字符"
            />
            <UButton type="submit" icon="i-lucide-search" label="搜索"/>
            <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw" label="重置" @click="resetQuery"/>
          </div>
        </UForm>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
      <UTable
          class="h-full"
          ref="table"
          v-model:column-visibility="columnVisibility"
          sticky
          :data="roleList"
          :columns="columns"
          :loading="loadingPageData"
          loading-color="primary"
          loading-animation="carousel"
      />
      </div>
    </div>
    <div class="system-page-shell__footer">
      <div class="system-page-footer">
        <p class="system-page-summary">当前共 {{ total }} 条角色记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </div>
  </div>
</template>
