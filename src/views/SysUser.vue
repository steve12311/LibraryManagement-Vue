<script setup lang="ts">
import {computed, h, onMounted, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {TableColumn} from "@nuxt/ui";
import { formatDateTime } from "@/utils/date-format";
import type {UserPageVO} from "@/api/system/user-api.ts"
import {StatusTypeEnum, UserGenderTypeEnum} from "@/enums/system/status-enum.ts";
import { createGenderOptions, createStatusOptions } from "@/utils/option-items";
import {useUserActions} from "@/composables/system/user/useUserActions";
import {useUserDialog} from "@/composables/system/user/useUserDialog";
import {useUserForm} from "@/composables/system/user/useUserForm";
import {useUserImportExport} from "@/composables/system/user/useUserImportExport";
import {useUserQuery} from "@/composables/system/user/useUserQuery";
import {useUserSubmit} from "@/composables/system/user/useUserSubmit";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";
import UserAssignRoleModal from "@/components/system/user/UserAssignRoleModal.vue";
import UserEditModal from "@/components/system/user/UserEditModal.vue";
import UserImportModal from "@/components/system/user/UserImportModal.vue";
import UserImportResultModal from "@/components/system/user/UserImportResultModal.vue";
import {useUserStore} from "@/store";

onMounted(() => {
  handleQuery()
})

const UAvatar = resolveComponent('UAvatar')
const USwitch = resolveComponent('USwitch')
const UCheckbox = resolveComponent('UCheckbox')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const USER_IMPORT_ACCEPT = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
const USER_IMPORT_DESCRIPTION = "仅支持 Excel 文件（.xlsx、.xls）"
const userStore = useUserStore()
const {queryParams, searchForm, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData} = useUserQuery()
const currentUserId = computed(() => userStore.userInfo.userId)
const currentUsername = computed(() => userStore.userInfo.username)
const statusQueryOptions = ref(createStatusOptions(true))
const table = useTemplateRef('table')
const columnVisibility = ref({
  id: false,
})
const openEditModal = ref(false)
const openAssignRoleModal = ref(false)
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增用户")
const loadingEditUser = ref(false)
const submittingEditUser = ref(false)
const loadingAssignRole = ref(false)
const submittingAssignRole = ref(false)
const resettingUserId = ref("")
const deletingUserId = ref("")
const togglingStatusUserId = ref("")
const assigningRoleUserId = ref("")
const editingUserId = ref("")
const assignRoleUserId = ref("")
const assignRoleUsername = ref("")
type AvatarFileItem = File | { file?: File; raw?: File }
type AvatarFileModel = AvatarFileItem | AvatarFileItem[]
const avatarModel = ref<File>()
const {
  initialUserFormData,
  editUserState,
  assignRoleState,
  roleOptions,
  loadingRoleOptions,
  fetchRoleOptions,
  resetEditUserForm,
  resetAssignRoleForm,
} = useUserForm({
  avatarModel,
  submittingEditUser,
  loadingEditUser,
  editingUserId,
  editModalMode,
  editModalTitle,
  assignRoleUserId,
  assignRoleUsername,
  submittingAssignRole,
  loadingAssignRole,
  assigningRoleUserId,
})
const {
  openEditUserModal,
  openAddUserModal,
  openAssignRoleDialog,
} = useUserDialog({
  openEditModal,
  openAssignRoleModal,
  editModalMode,
  editModalTitle,
  loadingEditUser,
  loadingAssignRole,
  assigningRoleUserId,
  editingUserId,
  assignRoleUserId,
  assignRoleUsername,
  avatarModel,
  initialUserFormData,
  editUserState,
  assignRoleState,
  fetchRoleOptions,
})
const {
  submitEditUser,
  submitAssignRole,
} = useUserSubmit({
  editModalMode,
  editingUserId,
  assignRoleUserId,
  editUserState,
  assignRoleState,
  submittingEditUser,
  submittingAssignRole,
  openEditModal,
  openAssignRoleModal,
  fetchData,
  getAvatarFile: () => getAvatarFileFromModel(avatarModel.value),
})
const {
  openImportModal,
  openImportResultModal,
  importFileModel,
  downloadingTemplate,
  importingUsers,
  exportingUsers,
  importResult,
  importSummary,
  resetImportState,
  resetImportFile,
  downloadTemplate,
  submitImportUsers,
  exportUsers,
} = useUserImportExport({
  fetchData,
  getExportQuery: () => ({...queryParams}),
})
const {
  openEditUserModalBySelection,
  confirmResetPassword,
  confirmDeleteUsers,
  updateUserStatus,
  deleteUserBySelection,
  isCurrentUser,
} = useUserActions({
  table,
  openEditUserModal,
  fetchData,
  resettingUserId,
  deletingUserId,
  togglingStatusUserId,
  currentUserId,
  currentUsername,
})
const genderOptions = ref(createGenderOptions())
const columns = ref<TableColumn<UserPageVO>[]>([
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
    header: "用户ID",
  },
  {
    id: "userInfo",
    header: "用户信息",
    cell: ({row}) => {
      return h('div', {class: 'flex items-center gap-3'}, [
        h(UAvatar, {
          size: "lg",
          src: row.original.avatar
        }),
        h("div", undefined, [
          h('p', {class: 'font-medium text-highlighted'}, row.original.nickname),
          h('p', {class: ''}, `@${row.original.username}`)
        ])
      ])
    }
  },
  {
    accessorKey: "roleNames",
    header: "角色",
  },
  {
    accessorKey: "gender",
    header: "性别",
    cell: ({row}) => {
      return getGenderLabel(row.original.gender)
    }
  },
  {
    accessorKey: "mobile",
    header: "手机号"
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({row}) => {
      const isSelf = isCurrentUser(row.original)
      const isToggling = togglingStatusUserId.value === String(row.original.id)
      return h(USwitch, {
        modelValue: row.original.status === StatusTypeEnum.ACCESS,
        disabled: isSelf || isToggling,
        title: isSelf ? "不能禁用当前登录用户" : "切换用户状态",
        "onUpdate:modelValue": (value: boolean) => {
          updateUserStatus(row.original, value)
        }
      }, undefined)
    }
  },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({row}) => formatDateTime(row.original.createTime),
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
            loading: loadingEditUser.value && editingUserId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openEditUserModal(row.original.id)
            }
          }),
        ]),
        h(UTooltip, {text: "重置密码", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-key",
            variant: "ghost",
            loading: resettingUserId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              confirmResetPassword(row.original.id, row.original.username)
            }
          }),
        ]),
        h(UTooltip, {text: "分配角色", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-id-card-lanyard",
            variant: "ghost",
            loading: assigningRoleUserId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openAssignRoleDialog(row.original.id, row.original.username)
            }
          }),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-trash-2",
            variant: "ghost",
            loading: deletingUserId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              confirmDeleteUsers([row.original.id], row.original.username ? [row.original.username] : [])
            }
          }),
        ]),
      ])
    }
  }
])
watch(openEditModal, (isOpen) => {
  if (!isOpen) {
    resetEditUserForm()
  }
})
watch(openAssignRoleModal, (isOpen) => {
  if (!isOpen) {
    resetAssignRoleForm()
  }
})

function getAvatarFileFromModel(model?: AvatarFileModel): File | undefined {
  if (!model) return void 0
  if (model instanceof File) return model
  if (Array.isArray(model)) {
    if (model.length === 0) return void 0
    const first = model[0]
    if (!first) return void 0
    if (first instanceof File) return first
    if (first.file instanceof File) return first.file
    if (first.raw instanceof File) return first.raw
    return void 0
  }
  if (model.file instanceof File) return model.file
  if (model.raw instanceof File) return model.raw
  return void 0
}

function getGenderLabel(gender?: number) {
  if (gender === UserGenderTypeEnum.UNKNOWN) return "保密"
  if (gender === UserGenderTypeEnum.MAN) return "男"
  if (gender === UserGenderTypeEnum.WOMAN) return "女"
  return "-"
}

function closeImportModal() {
  openImportModal.value = false
  resetImportFile()
}

function updateImportModal(open: boolean) {
  if (open) {
    openImportModal.value = true
    return
  }
  closeImportModal()
}

function closeImportResultModal() {
  openImportResultModal.value = false
  resetImportState()
}

function updateImportResultModal(open: boolean) {
  if (open) {
    openImportResultModal.value = true
    return
  }
  closeImportResultModal()
}
</script>

<template>
  <UserImportModal
      :open="openImportModal"
      :file-model="importFileModel"
      :downloading-template="downloadingTemplate"
      :importing="importingUsers"
      :accept="USER_IMPORT_ACCEPT"
      :description="USER_IMPORT_DESCRIPTION"
      @update:open="updateImportModal"
      @update:file-model="importFileModel = $event"
      @download-template="downloadTemplate"
      @submit="submitImportUsers"
  />

  <UserImportResultModal
      :open="openImportResultModal"
      :result="importResult"
      :summary="importSummary"
      @update:open="updateImportResultModal"
  />

  <UserAssignRoleModal
      :open="openAssignRoleModal"
      :username="assignRoleUsername"
      :state="assignRoleState"
      :role-options="roleOptions"
      :loading-role-options="loadingRoleOptions"
      :loading-assign-role="loadingAssignRole"
      :submitting="submittingAssignRole"
      @update:open="openAssignRoleModal = $event"
      @update:state="assignRoleState = $event"
      @submit="submitAssignRole"
  />

  <UserEditModal
      :open="openEditModal"
      :title="editModalTitle"
      :state="editUserState"
      :gender-options="genderOptions"
      :role-options="roleOptions"
      :loading-role-options="loadingRoleOptions"
      :avatar-model="avatarModel"
      :submitting="submittingEditUser"
      @update:open="openEditModal = $event"
      @update:state="editUserState = $event"
      @update:avatar-model="avatarModel = $event"
      @submit="submitEditUser"
  />
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="USER"
          title="用户管理"
          description="账号资料、角色分配与启停管理"
          :stats="[
            { label: '总用户', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '每页条数', value: queryParams.pageSize }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup
              :table="table"
              @flush="handleQuery"
          >
            <UButton icon="i-lucide-plus" @click="openAddUserModal" variant="subtle" label="新增"/>
            <UButton
                icon="i-lucide-clipboard-pen-line"
                :disabled="(table?.tableApi?.getFilteredSelectedRowModel().flatRows.length ?? 0) !== 1"
                @click="openEditUserModalBySelection"
                variant="subtle"
                label="修改"
                color="info"
            />
            <UButton
                icon="i-lucide-trash-2"
                variant="subtle"
                :disabled="(table?.tableApi?.getFilteredSelectedRowModel().flatRows.length ?? 0) === 0"
                @click="deleteUserBySelection"
                label="删除"
                color="error"
            />
            <UButton
                icon="i-lucide-upload"
                variant="subtle"
                label="导入用户"
                :loading="importingUsers"
                @click="openImportModal = true"
            />
            <UButton
                icon="i-lucide-download"
                variant="subtle"
                label="导出用户"
                :loading="exportingUsers"
                @click="exportUsers"
            />
          </ActionGroup>
        </template>

        <UForm @submit="handleQuery" class="w-full">
          <div class="system-query-row">
            <UInput
                v-model="searchForm.keywords"
                icon="i-lucide-search"
                size="md"
                variant="outline"
                class="w-72"
                placeholder="搜索用户名/昵称/手机号"
            />
            <USelect
                v-model="searchForm.status"
                valueKey="value"
                :items="statusQueryOptions"
                class="w-36"
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
          :data="pageData"
          :columns="columns"
          :loading="loadingPageData"
          loading-color="primary"
          loading-animation="carousel"
      />
      </div>
    </div>
    <div class="system-page-shell__footer">
      <div class="system-page-footer">
        <p class="system-page-summary">共 {{ total }} 条记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </div>
  </div>
</template>
