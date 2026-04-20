<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";
import type {UserPageVO} from "@/api/system/user-api.ts"
import {UserGenderTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum.ts";
import {useUserActions} from "@/composables/system/user/useUserActions";
import {useUserDialog} from "@/composables/system/user/useUserDialog";
import {useUserForm} from "@/composables/system/user/useUserForm";
import {useUserImportExport} from "@/composables/system/user/useUserImportExport";
import {useUserQuery} from "@/composables/system/user/useUserQuery";
import {useUserSubmit} from "@/composables/system/user/useUserSubmit";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";

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
const {queryParams, searchForm, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData} = useUserQuery()
const statusQueryOptions = ref<OptionType[]>([
  {
    label: "全部状态",
    value: -1,
  },
  {
    label: "启用",
    value: StatusTypeEnum.ACCESS,
  },
  {
    label: "禁用",
    value: StatusTypeEnum.BAN,
  }
])
const table = useTemplateRef('table')
const editForm = useTemplateRef('editForm')
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
const avatarModel = ref<File>()
type AvatarFileItem = File | { file?: File; raw?: File }
type AvatarFileModel = AvatarFileItem | AvatarFileItem[]
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
} = useUserActions({
  table,
  openEditUserModal,
  fetchData,
  resettingUserId,
  deletingUserId,
  togglingStatusUserId,
})
const genderOptions = ref<OptionType[]>([
  {
    label: "保密",
    value: UserGenderTypeEnum.UNKNOWN
  },
  {
    label: "男",
    value: UserGenderTypeEnum.MAN
  },
  {
    label: "女",
    value: UserGenderTypeEnum.WOMAN
  }
])
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
      return h(USwitch, {
        modelValue: row.original.status === 1,
        disabled: togglingStatusUserId.value === String(row.original.id),
        "onUpdate:modelValue": (value: boolean) => {
          updateUserStatus(row.original.id, value)
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

function closeImportResultModal() {
  openImportResultModal.value = false
  resetImportState()
}
</script>

<template>
  <UModal
      v-model:open="openImportModal"
      title="导入用户"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border border-default bg-default shadow-lg' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">批量导入</p>
        <p class="system-modal-description">请先下载最新模板，按角色名称填写后再上传 Excel 文件。</p>
      </div>

      <div class="mt-5 space-y-4">
        <div class="flex items-center justify-between gap-3 rounded-2xl border border-default bg-muted/30 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-highlighted">模板说明</p>
            <p class="mt-1 text-sm text-muted">角色列填写角色名称，多角色使用英文逗号分隔。</p>
          </div>
          <UButton
              label="下载模板"
              icon="i-lucide-file-down"
              variant="subtle"
              :loading="downloadingTemplate"
              @click="downloadTemplate"
          />
        </div>

        <UFileUpload
            v-model="importFileModel"
            :accept="USER_IMPORT_ACCEPT"
            label="上传用户导入文件"
            :description="USER_IMPORT_DESCRIPTION"
            class="w-full min-h-32"
        />

        <ul class="space-y-1 text-sm text-muted">
          <li>1. 模板中的角色字段使用角色名称，不填写角色 ID。</li>
          <li>2. 导入采用部分成功模型，失败明细会在导入结果中展示。</li>
          <li>3. 导出会复用当前列表页已生效的筛选条件。</li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="closeImportModal"/>
        <UButton label="开始导入" icon="i-lucide-upload" :loading="importingUsers" @click="submitImportUsers"/>
      </div>
    </template>
  </UModal>

  <UModal
      v-model:open="openImportResultModal"
      title="导入结果"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border border-default bg-default shadow-lg' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">导入完成</p>
        <p class="system-modal-description">{{ importSummary }}</p>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-default bg-muted/30 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted">总条数</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ importResult.totalCount }}</p>
        </div>
        <div class="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-success">成功</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ importResult.successCount }}</p>
        </div>
        <div class="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-warning">失败</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ importResult.failureCount }}</p>
        </div>
      </div>

      <div class="mt-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-highlighted">失败明细</p>
          <span class="text-xs text-muted">{{ importResult.messages.length }} 条</span>
        </div>

        <div
            v-if="importResult.messages.length"
            class="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-default bg-muted/20 px-4 py-3"
        >
          <ul class="space-y-2 text-sm text-default">
            <li v-for="message in importResult.messages" :key="message" class="leading-6">
              {{ message }}
            </li>
          </ul>
        </div>
        <div
            v-else
            class="mt-3 rounded-2xl border border-default bg-muted/20 px-4 py-6 text-sm text-muted"
        >
          本次导入没有失败明细。
        </div>
      </div>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="关闭" @click="closeImportResultModal"/>
      </div>
    </template>
  </UModal>

  <UModal
      v-model:open="openAssignRoleModal"
      :title="`分配角色${assignRoleUsername ? ` - ${assignRoleUsername}` : ''}`"
      :ui="{ content: 'sm:max-w-xl rounded-[28px] border border-default bg-default shadow-lg' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">角色分配</p>
        <p class="system-modal-description">为当前用户调整角色集合，保存后立即更新权限范围。</p>
      </div>
      <UForm :state="assignRoleState" @submit="submitAssignRole" class="mt-5 space-y-4">
        <UFormField class="w-full" label="角色">
          <USelect
              multiple
              valueKey="value"
              :loading="loadingRoleOptions || loadingAssignRole"
              v-model="assignRoleState.roleIds"
              :items="roleOptions"
              class="w-full"
              placeholder="请选择角色"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="openAssignRoleModal=false"/>
        <UButton label="保存" :loading="submittingAssignRole" @click="submitAssignRole"/>
      </div>
    </template>
  </UModal>
  <UModal
      v-model:open="openEditModal"
      :title="editModalTitle"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border border-default bg-default shadow-lg' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">用户资料</p>
        <p class="system-modal-description">维护基础资料、角色信息和头像。</p>
      </div>
      <UForm ref="editForm" :state="editUserState" @submit="submitEditUser" class="mt-5 space-y-4">
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="昵称" required>
            <UInput v-model="editUserState.nickname" class="w-full" placeholder="请输入昵称"/>
          </UFormField>
          <UFormField class="w-full" label="手机号">
            <UInput v-model="editUserState.mobile" class="w-full" placeholder="请输入手机号"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="性别">
            <USelect v-model="editUserState.gender" valueKey="value" :items="genderOptions" class="w-full"/>
          </UFormField>
          <UFormField class="w-full" label="电子邮箱">
            <UInput v-model="editUserState.email" class="w-full" type="email" placeholder="请输入电子邮箱"/>
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="角色" required>
          <USelect
              multiple
              valueKey="value"
              :loading="loadingRoleOptions"
              v-model="editUserState.roleIds"
              :items="roleOptions"
              class="w-full"
              placeholder="请选择角色"
          />
        </UFormField>
        <UFormField class="w-full" label="头像">
          <UFieldGroup class="w-full items-center gap-3">
            <UAvatar size="lg" :src="editUserState.avatar"/>
            <UFileUpload
                v-model="avatarModel"
                accept="image/*"
                label="上传头像拖到此处"
                description="图片会转为 Base64 存储"
                class="w-full min-h-24"
            />
          </UFieldGroup>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="openEditModal=false"/>
        <UButton label="保存" :loading="submittingEditUser" @click="editForm?.submit()"/>
      </div>
    </template>
  </UModal>
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="USER MANAGEMENT"
          title="用户管理"
          description="统一维护账号资料、角色分配与启停状态。"
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
              @add-row="openAddUserModal"
              @modify-row="openEditUserModalBySelection"
              @delete-row="deleteUserBySelection"
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
                icon="i-lucide-file-down"
                variant="subtle"
                label="下载模板"
                :loading="downloadingTemplate"
                @click="downloadTemplate"
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
        <p class="system-page-summary">当前共 {{ total }} 条用户记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </div>
  </div>
</template>
