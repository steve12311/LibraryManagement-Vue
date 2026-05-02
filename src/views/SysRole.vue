<script setup lang="ts">
import { h, onMounted, ref, resolveComponent, useTemplateRef } from "vue"
import type { TableColumn } from "@nuxt/ui"
import { formatDateTime } from "@/utils/date-format"
import type { RolePageVO } from "@/api/system/role-api"
import { StatusTypeEnum } from "@/enums/system/status-enum"
import { useRoleMenuAssign } from "@/composables/system/role/useRoleMenuAssign"
import { useRoleQuery } from "@/composables/system/role/useRoleQuery"
import { useRoleForm } from "@/composables/system/role/useRoleForm"
import { useRoleDialog } from "@/composables/system/role/useRoleDialog"
import { useRoleActions } from "@/composables/system/role/useRoleActions"
import SystemPageHeader from "@/components/system/SystemPageHeader.vue"
import SystemQueryCard from "@/components/system/SystemQueryCard.vue"
import RoleEditModal from "@/components/system/role/RoleEditModal.vue"
import RoleAssignUsersModal from "@/components/system/role/RoleAssignUsersModal.vue"
import RoleAssignMenusModal from "@/components/system/role/RoleAssignMenusModal.vue"

const UCheckbox = resolveComponent("UCheckbox")
const USwitch = resolveComponent("USwitch")
const UFieldGroup = resolveComponent("UFieldGroup")
const UButton = resolveComponent("UButton")
const UTooltip = resolveComponent("UTooltip")

onMounted(() => { handleQuery() })

const { queryParams, searchForm, total, roleList, loadingPageData, handleQuery, resetQuery, fetchData } = useRoleQuery()

const submittingEditRole = ref(false)
const loadingEditRole = ref(false)
const editingRoleId = ref("")
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增角色")

const { roleState, statusOptions, dataScopeOptions, userOptions, normalizeRolePayload, resetEditRoleForm, fetchUserOptions, loadRoleForm } = useRoleForm({
  submittingEditRole, loadingEditRole, editingRoleId, editModalMode, editModalTitle,
})

const submittingAssignUsers = ref(false)
const loadingAssignUsers = ref(false)
const assigningRoleId = ref("")
const assignUsersRoleId = ref("")
const assignUsersRoleName = ref("")
const assignUserIds = ref<Array<string | number>>([])

const table = useTemplateRef("table")
const columnVisibility = ref({ id: false })

function getFirstSelectedRow() {
  return table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original as { id?: string | number } | undefined
}

function getSelectedRows() {
  return (table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []) as { original: { id?: string | number; name?: string } }[]
}

const { openEditModal, openAssignUsersModal, openAddRoleModal, openEditRoleModal, openEditRoleBySelection, openAssignUsersDialog } = useRoleDialog({
  submittingEditRole, loadingEditRole, editingRoleId, editModalMode, editModalTitle,
  loadingAssignUsers, submittingAssignUsers, assigningRoleId, assignUsersRoleId, assignUsersRoleName, assignUserIds,
  resetEditRoleForm, loadRoleForm, fetchUserOptions, getFirstSelectedRow,
})

const deletingRoleId = ref("")
const roleStatusUpdatingId = ref("")

const { isRootRole, submitEditRole, submitAssignUsers, confirmDeleteRoles, deleteRoleBySelection, updateRoleStatus } = useRoleActions({
  roleState, openEditModal, editModalMode, editingRoleId,
  submittingEditRole, submittingAssignUsers, deletingRoleId, roleStatusUpdatingId,
  assignUsersRoleId, assignUserIds,
  normalizeRolePayload, fetchData,
  getSelectedRows,
})

const openAssignMenuModal = ref(false)
const submittingAssignMenus = ref(false)
const loadingAssignMenus = ref(false)
const assigningMenuRoleId = ref("")

const { assignMenuRoleName, menuTreeOptions, assignedMenuIds, openAssignMenuDialog, submitAssignMenus } = useRoleMenuAssign({
  openAssignMenuModal, loadingAssignMenus, submittingAssignMenus, assigningMenuRoleId,
})

async function submitAssignMenusForm(menuIds: number[]) {
  await submitAssignMenus(menuIds)
}

const columns = ref<TableColumn<RolePageVO>[]>([
  {
    id: "select",
    header: ({ table: t }) => h(UCheckbox, {
      modelValue: t.getIsSomePageRowsSelected() ? "indeterminate" : t.getIsAllPageRowsSelected(),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => t.toggleAllPageRowsSelected(!!value),
      "aria-label": "选择全部",
    }),
    cell: ({ row }) => h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => row.toggleSelected(!!value),
      "aria-label": "选择单行",
    }),
  },
  { id: "id", accessorKey: "id", header: "角色ID" },
  { id: "name", accessorKey: "name", header: "角色名称" },
  { id: "code", accessorKey: "code", header: "权限字符" },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const isRoot = isRootRole(row.original.id)
      const isUpdating = roleStatusUpdatingId.value === String(row.original.id)
      return h(USwitch, {
        modelValue: row.original.status === StatusTypeEnum.ACCESS,
        disabled: isRoot || isUpdating,
        title: isRoot ? "ROOT角色不可禁用" : "切换角色状态",
        "onUpdate:modelValue": (value: boolean) => { updateRoleStatus(row.original.id, value) },
      })
    },
  },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({ row }) => formatDateTime(row.original.createTime),
  },
  {
    id: "action",
    accessorKey: "userId",
    header: "操作",
    cell: ({ row }) => {
      if (isRootRole(row.original.id)) return h("div")
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, { text: "修改", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-clipboard-pen-line",
            variant: "ghost",
            loading: loadingEditRole.value && editingRoleId.value === String(row.original.id),
            onClick: (ev: Event) => { ev.stopPropagation(); openEditRoleModal(row.original.id) },
          }),
        ]),
        h(UTooltip, { text: "分配菜单", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-shield-check",
            variant: "ghost",
            loading: loadingAssignMenus.value && assigningMenuRoleId.value === String(row.original.id),
            onClick: (ev: Event) => { ev.stopPropagation(); openAssignMenuDialog(row.original.id, row.original.name) },
          }),
        ]),
        h(UTooltip, { text: "分配用户", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-user",
            variant: "ghost",
            loading: loadingAssignUsers.value && assigningRoleId.value === String(row.original.id),
            onClick: (ev: Event) => { ev.stopPropagation(); openAssignUsersDialog(row.original.id, row.original.name) },
          }),
        ]),
        h(UTooltip, { text: "删除", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-trash-2",
            variant: "ghost",
            loading: deletingRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              confirmDeleteRoles([row.original.id!], row.original.name ? [row.original.name] : [])
            },
          }),
        ]),
      ])
    },
  },
])
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
          kicker="ROLE"
          title="角色管理"
          description="角色资料、菜单授权与用户分配"
          :stats="[
            { label: '角色总数', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '每页条数', value: queryParams.pageSize },
          ]"
      />
      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="table" @flush="handleQuery" @add-row="openAddRoleModal"
                       @modify-row="openEditRoleBySelection" @delete-row="deleteRoleBySelection"/>
        </template>
        <UForm @submit="handleQuery" class="w-full">
          <div class="system-query-row">
            <UInput v-model="searchForm.keywords" icon="i-lucide-search" size="md" variant="outline" class="w-72" placeholder="搜索角色名称/权限字符"/>
            <UButton type="submit" icon="i-lucide-search" label="搜索"/>
            <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw" label="重置" @click="resetQuery"/>
          </div>
        </UForm>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
        <UTable class="h-full" ref="table" v-model:column-visibility="columnVisibility" sticky :data="roleList" :columns="columns" :loading="loadingPageData" loading-color="primary" loading-animation="carousel"/>
      </div>
    </div>
    <div class="system-page-shell__footer">
      <div class="system-page-footer">
        <p class="system-page-summary">共 {{ total }} 条记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total" :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </div>
  </div>
</template>
