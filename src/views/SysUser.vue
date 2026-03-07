<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";
import type {UserPageVO} from "@/api/system/user-api.ts"
import {UserGenderTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum.ts";
import {useUserActions} from "@/composables/system/user/useUserActions";
import {useUserDialog} from "@/composables/system/user/useUserDialog";
import {useUserForm} from "@/composables/system/user/useUserForm";
import {useUserQuery} from "@/composables/system/user/useUserQuery";
import {useUserSubmit} from "@/composables/system/user/useUserSubmit";

onMounted(() => {
  handleQuery()
})

const UAvatar = resolveComponent('UAvatar')
const USwitch = resolveComponent('USwitch')
const UCheckbox = resolveComponent('UCheckbox')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
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
</script>

<template>
  <UModal v-model:open="openAssignRoleModal" :title="`分配角色${assignRoleUsername ? ` - ${assignRoleUsername}` : ''}`">
    <template #body>
      <UForm :state="assignRoleState" @submit="submitAssignRole" class="space-y-4">
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
      <div class="flex justify-end w-full gap-2">
        <UButton label="取消" variant="ghost" @click="openAssignRoleModal=false"/>
        <UButton label="保存" :loading="submittingAssignRole" @click="submitAssignRole"/>
      </div>
    </template>
  </UModal>
  <UModal v-model:open="openEditModal" :title="editModalTitle">
    <template #body>
      <UForm ref="editForm" :state="editUserState" @submit="submitEditUser" class="space-y-4">
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
      <div class="flex justify-end w-full gap-2">
        <UButton label="取消" variant="ghost" @click="openEditModal=false"/>
        <UButton label="保存" :loading="submittingEditUser" @click="editForm?.submit()"/>
      </div>
    </template>
  </UModal>
  <UCard class="flex h-full min-h-0 flex-col" :ui="{ body: 'flex-1 min-h-0' }">
    <template #header>
      <div class="space-y-3">
        <ActionGroup :table="table" @flush="handleQuery" @add-row="openAddUserModal"
                     @modify-row="openEditUserModalBySelection" @delete-row="deleteUserBySelection"/>
        <UForm @submit="handleQuery" class="w-full">
          <div class="flex flex-wrap items-center gap-2">
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
      </div>
    </template>
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
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>
