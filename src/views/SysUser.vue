<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {SelectMenuItem, TableColumn} from "@nuxt/ui";
import moment from "moment";
import {ElMessageBox} from "element-plus";
import UserAPI, {type UserForm, type UserPageQuery, type UserPageVO} from "@/api/system/user-api.ts"
import RoleAPI from "@/api/system/role-api.ts";
import {UserGenderTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum.ts";

onMounted(() => {
  handleQuery()
})

const UAvatar = resolveComponent('UAvatar')
const USwitch = resolveComponent('USwitch')
const UCheckbox = resolveComponent('UCheckbox')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const toast = useToast()

const queryParams = reactive<UserPageQuery>({
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const pageData = ref<UserPageVO[]>();
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
const loadingRoleOptions = ref(false)
const loadingAssignRole = ref(false)
const submittingAssignRole = ref(false)
const resettingUserId = ref("")
const deletingUserId = ref("")
const assigningRoleUserId = ref("")
const editingUserId = ref("")
const assignRoleUserId = ref("")
const assignRoleUsername = ref("")
const avatarModel = ref<File>()
const roleOptions = ref<SelectMenuItem[]>([])
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
const initialUserFormData: UserForm = {
  id: 0,
  username: "",
  nickname: "",
  mobile: "",
  gender: UserGenderTypeEnum.UNKNOWN,
  avatar: "",
  email: "",
  status: StatusTypeEnum.ACCESS,
  deptId: 0,
  roleIds: [],
  openId: ""
}
const editUserState = ref<UserForm>({...initialUserFormData})
const assignRoleState = ref<UserForm>({...initialUserFormData})
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
      if (row.original.gender === 0) {
        return "保密"
      } else if (row.original.gender === 1) {
        return "男"
      } else {
        return "女"
      }
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
        "onUpdate:modelValue": (value: boolean) => {
          UserAPI.changeStatus(row.original.id, value ? StatusTypeEnum.ACCESS : StatusTypeEnum.BAN)
              .then(()=>{
                fetchData()
              })
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

function getAvatarFileFromModel(model?: File): File | undefined {
  if (!model) return void 0
  const value = model as any
  if (value instanceof File) return value
  if (value?.file instanceof File) return value.file
  if (value?.raw instanceof File) return value.raw
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first instanceof File) return first
    if (first?.file instanceof File) return first.file
    if (first?.raw instanceof File) return first.raw
  }
  return void 0
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function resetEditUserForm() {
  editUserState.value = {...initialUserFormData}
  avatarModel.value = void 0
  submittingEditUser.value = false
  loadingEditUser.value = false
  editingUserId.value = ""
  editModalMode.value = "add"
  editModalTitle.value = "新增用户"
}

function resetAssignRoleForm() {
  assignRoleState.value = {...initialUserFormData}
  assignRoleUserId.value = ""
  assignRoleUsername.value = ""
  submittingAssignRole.value = false
  loadingAssignRole.value = false
  assigningRoleUserId.value = ""
}

async function fetchRoleOptions() {
  loadingRoleOptions.value = true
  try {
    roleOptions.value = await RoleAPI.getOptions()
  } catch (e) {
    console.log(e)
  } finally {
    loadingRoleOptions.value = false
  }
}

async function openEditUserModal(id: string | number) {
  if (!id && id !== 0) return
  loadingEditUser.value = true
  editingUserId.value = String(id)
  editModalMode.value = "edit"
  editModalTitle.value = "修改用户信息"
  try {
    const [formData] = await Promise.all([
      UserAPI.getFormData(id),
      fetchRoleOptions()
    ])
    editUserState.value = {
      ...initialUserFormData,
      ...formData,
      id: Number(formData.id ?? id),
      roleIds: Array.isArray(formData.roleIds) ? formData.roleIds.map(item => Number(item)) : []
    }
    avatarModel.value = void 0
    openEditModal.value = true
  } catch (e) {
    console.log(e)
  } finally {
    loadingEditUser.value = false
  }
}

async function openAddUserModal() {
  editingUserId.value = ""
  editModalMode.value = "add"
  editModalTitle.value = "新增用户"
  editUserState.value = {...initialUserFormData}
  avatarModel.value = void 0
  await fetchRoleOptions()
  openEditModal.value = true
}

async function openAssignRoleDialog(id: string | number, username?: string) {
  if (!id && id !== 0) return
  assigningRoleUserId.value = String(id)
  loadingAssignRole.value = true
  assignRoleUserId.value = String(id)
  assignRoleUsername.value = username ?? ""
  try {
    const [formData] = await Promise.all([
      UserAPI.getFormData(id),
      fetchRoleOptions()
    ])
    assignRoleState.value = {
      ...initialUserFormData,
      ...formData,
      id: Number(formData.id ?? id),
      roleIds: Array.isArray(formData.roleIds) ? formData.roleIds.map(item => Number(item)) : []
    }
    openAssignRoleModal.value = true
  } catch (e) {
    console.log(e)
  } finally {
    loadingAssignRole.value = false
    assigningRoleUserId.value = ""
  }
}

function openEditUserModalBySelection() {
  const selectedRow = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original
  if (!selectedRow?.id) {
    toast.add({title: "错误", description: "请选择需要修改的用户", color: "error"})
    return
  }
  openEditUserModal(selectedRow.id)
}

async function submitEditUser() {
  if (editModalMode.value === "edit" && !editingUserId.value) {
    toast.add({title: "错误", description: "用户ID不能为空", color: "error"})
    return
  }
  if (!editUserState.value.nickname?.trim()) {
    toast.add({title: "错误", description: "昵称不能为空", color: "error"})
    return
  }
  if (!Array.isArray(editUserState.value.roleIds) || editUserState.value.roleIds.length === 0) {
    toast.add({title: "错误", description: "请至少选择一个角色", color: "error"})
    return
  }
  const payload: UserForm = {
    ...editUserState.value,
    id: editModalMode.value === "edit" ? Number(editingUserId.value) : Number(editUserState.value.id ?? 0),
    roleIds: Array.isArray(editUserState.value.roleIds)
        ? editUserState.value.roleIds.map(item => Number(item))
        : []
  }

  try {
    submittingEditUser.value = true
    const file = getAvatarFileFromModel(avatarModel.value)
    if (file) {
      payload.avatar = await fileToBase64(file)
    }
    if (editModalMode.value === "add") {
      await UserAPI.create(payload)
      toast.add({title: "成功", description: "新增成功", color: "success"})
    } else {
      await UserAPI.update(editingUserId.value, payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
    }
    openEditModal.value = false
    await fetchData()
  } catch (e) {
    console.log(e)
  } finally {
    submittingEditUser.value = false
  }
}

async function submitAssignRole() {
  if (!assignRoleUserId.value) {
    toast.add({title: "错误", description: "用户ID不能为空", color: "error"})
    return
  }
  const payload: UserForm = {
    ...assignRoleState.value,
    id: Number(assignRoleUserId.value),
    roleIds: Array.isArray(assignRoleState.value.roleIds)
        ? assignRoleState.value.roleIds.map(item => Number(item))
        : []
  }
  try {
    submittingAssignRole.value = true
    await UserAPI.update(assignRoleUserId.value, payload)
    toast.add({title: "成功", description: "分配角色成功", color: "success"})
    openAssignRoleModal.value = false
    await fetchData()
  } catch (e) {
    console.log(e)
  } finally {
    submittingAssignRole.value = false
  }
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
    resettingUserId.value = String(id)
    await UserAPI.resetPassword(id)
    toast.add({title: "成功", description: "密码已重置为默认密码 123456", color: "success"})
  } catch (e: any) {
    if (e !== "cancel" && e !== "close") {
      console.log(e)
    }
  } finally {
    resettingUserId.value = ""
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
    deletingUserId.value = ids.length === 1 ? String(ids[0] ?? "") : "__batch__"
    await UserAPI.delete(ids)
    toast.add({title: "成功", description: "删除成功", color: "success"})
    await fetchData()
  } catch (e: any) {
    if (e !== "cancel" && e !== "close") {
      console.log(e)
    }
  } finally {
    deletingUserId.value = ""
  }
}

function deleteUserBySelection() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
  if (!selectedRows.length) {
    toast.add({title: "错误", description: "请选择需要删除的用户", color: "error"})
    return
  }
  const deleteUsers = selectedRows
      .map(row => row.original)
      .filter(item => item.id && Number(item.id) !== 1)
  if (!deleteUsers.length) {
    toast.add({title: "错误", description: "超级管理员不可删除", color: "error"})
    return
  }
  const ids = deleteUsers.map(item => item.id)
  const usernames = deleteUsers.map(item => item.username ?? "")
  confirmDeleteUsers(ids, usernames)
}

// 查询（重置页码后获取数据）
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 获取数据
async function fetchData() {
  try {
    const data = await UserAPI.getPage(queryParams);
    pageData.value = data.list;
    total.value = data.total;
  } catch (e) {
    console.log(e);
  }
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
  <UCard>
    <template #header>
      <ActionGroup :table="table" @flush="handleQuery" @add-row="openAddUserModal"
                   @modify-row="openEditUserModalBySelection" @delete-row="deleteUserBySelection"/>
    </template>
    <UTable ref="table" v-model:column-visibility="columnVisibility" sticky :data="pageData" :columns="columns"/>
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
