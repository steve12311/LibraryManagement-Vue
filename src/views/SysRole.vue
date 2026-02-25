<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {SelectMenuItem, TableColumn} from "@nuxt/ui";
import moment from "moment/moment";
import {ElMessageBox} from "element-plus";
import UserAPI from "@/api/user-api.ts";
import RoleAPI, {type RoleForm, type RolePageQuery, type RolePageVO} from "@/api/role-api.ts";
import {DataScopeTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum.ts";

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
const roleForm = useTemplateRef("roleForm")
const assignForm = useTemplateRef("assignForm")
const columnVisibility = ref({
  id: false,
})
const total = ref(0);
const queryParams = reactive<RolePageQuery>({
  pageNum: 1,
  pageSize: 10,
});
const roleList = ref<RolePageVO[]>([])
const openEditModal = ref(false)
const openAssignModal = ref(false)
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增角色")
const loadingEditRole = ref(false)
const submittingEditRole = ref(false)
const loadingAssignUsers = ref(false)
const submittingAssignUsers = ref(false)
const editingRoleId = ref("")
const assigningRoleId = ref("")
const deletingRoleId = ref("")
const assignRoleId = ref("")
const assignRoleName = ref("")
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
  dataScope: DataScopeTypeEnum.ALL
}
const roleState = ref<RoleForm>({...initialRoleFormData})
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
        // h(UTooltip, {text: "数据权限", delayDuration: 0}, () => [
        //   h(UButton, {icon: "i-lucide-lock-keyhole", variant: "ghost"}),
        // ]),
        h(UTooltip, {text: "分配用户", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-user",
            variant: "ghost",
            loading: loadingAssignUsers.value && assigningRoleId.value === String(row.original.id),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openAssignUsersModal(row.original.id, row.original.name)
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
              confirmDeleteRoles([row.original.id], row.original.name ? [row.original.name] : [])
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
watch(openAssignModal, (isOpen) => {
  if (!isOpen) {
    resetAssignUsersForm()
  }
})

function normalizeUserOptions(items: SelectMenuItem[]) {
  return items.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const avatarValue = (item as any).avatar
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
  assignRoleId.value = ""
  assignRoleName.value = ""
  submittingAssignUsers.value = false
  loadingAssignUsers.value = false
  assigningRoleId.value = ""
}

async function fetchUserOptions() {
  try {
    const options = await UserAPI.getOptions()
    userOptions.value = normalizeUserOptions(options ?? [])
  } catch (e) {
    console.log(e)
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

async function openEditRoleModal(id: string | number) {
  if (!id && id !== 0) return
  loadingEditRole.value = true
  editingRoleId.value = String(id)
  editModalMode.value = "edit"
  editModalTitle.value = "修改角色"
  try {
    const formData = await RoleAPI.getRoleForm(Number(id))
    roleState.value = {
      ...initialRoleFormData,
      ...formData,
      id: Number(formData.id ?? id),
      sort: Number(formData.sort ?? initialRoleFormData.sort),
      status: Number(formData.status ?? initialRoleFormData.status),
      dataScope: Number(formData.dataScope ?? initialRoleFormData.dataScope)
    }
    openEditModal.value = true
  } catch (e) {
    console.log(e)
  } finally {
    loadingEditRole.value = false
  }
}

function openEditRoleBySelection() {
  const selectedRow = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original
  if (!selectedRow?.id) {
    toast.add({title: "错误", description: "请选择需要修改的角色", color: "error"})
    return
  }
  openEditRoleModal(selectedRow.id)
}

async function submitEditRole() {
  if (!roleState.value.name?.trim()) {
    toast.add({title: "错误", description: "角色名称不能为空", color: "error"})
    return
  }
  if (!roleState.value.code?.trim()) {
    toast.add({title: "错误", description: "权限字符不能为空", color: "error"})
    return
  }
  const payload: RoleForm = {
    ...roleState.value,
    id: editModalMode.value === "edit" ? Number(editingRoleId.value) : Number(roleState.value.id ?? 0),
    sort: Number(roleState.value.sort ?? 0),
    status: Number(roleState.value.status ?? StatusTypeEnum.ACCESS),
    dataScope: Number(roleState.value.dataScope ?? DataScopeTypeEnum.ALL)
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
  } catch (e) {
    console.log(e)
  } finally {
    submittingEditRole.value = false
  }
}

async function openAssignUsersModal(id: string | number, name?: string) {
  if (!id && id !== 0) return
  assigningRoleId.value = String(id)
  loadingAssignUsers.value = true
  assignRoleId.value = String(id)
  assignRoleName.value = name ?? ""
  assignUserIds.value = []
  try {
    await fetchUserOptions()
    openAssignModal.value = true
  } catch (e) {
    console.log(e)
  } finally {
    loadingAssignUsers.value = false
    assigningRoleId.value = ""
  }
}

async function submitAssignUsers() {
  if (!assignRoleId.value) {
    toast.add({title: "错误", description: "角色ID不能为空", color: "error"})
    return
  }
  if (!assignUserIds.value.length) {
    toast.add({title: "错误", description: "请选择要分配的用户", color: "error"})
    return
  }
  try {
    submittingAssignUsers.value = true
    const userIds = assignUserIds.value
        .map(item => Number(item))
        .filter(item => !Number.isNaN(item))
    await RoleAPI.assignUsersToRole(Number(assignRoleId.value), userIds)
    toast.add({title: "成功", description: "分配用户成功", color: "success"})
    openAssignModal.value = false
  } catch (e) {
    console.log(e)
  } finally {
    submittingAssignUsers.value = false
  }
}

async function confirmDeleteRoles(ids: Array<string | number>, names: string[] = []) {
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
    await Promise.all(ids.map(id => RoleAPI.delete(Number(id))))
    toast.add({title: "成功", description: "删除成功", color: "success"})
    await fetchData()
  } catch (e: any) {
    if (e !== "cancel" && e !== "close") {
      console.log(e)
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
  const ids = deleteRoles.map(item => item.id as string)
  const names = deleteRoles.map(item => item.name ?? "")
  confirmDeleteRoles(ids, names)
}

async function updateRoleStatus(roleId: string | number | undefined, value: boolean) {
  if (!roleId) return
  const status = value ? StatusTypeEnum.ACCESS : StatusTypeEnum.BAN
  try {
    await RoleAPI.updateRoleStatus(Number(roleId), status)
    toast.add({title: "成功", description: "状态已更新", color: "success"})
    await fetchData()
  } catch (e) {
    console.log(e)
  }
}

// 获取数据
async function fetchData() {
  try {
    const data = await RoleAPI.getPage(queryParams)
    roleList.value = data.list;
    total.value = data.total;
  } catch (e) {
    console.log(e);
  }
}

// 查询（重置页码后获取数据）
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}
</script>

<template>
  <UModal v-model:open="openAssignModal" :title="`分配用户${assignRoleName ? ` - ${assignRoleName}` : ''}`">
    <template #body>
      <UForm ref="assignForm" @submit="submitAssignUsers" class="space-y-4">
        <UFormField class="w-full" label="用户" required>
          <USelectMenu
              multiple
              valueKey="value"
              v-model="assignUserIds"
              :items="userOptions"
              :loading="loadingAssignUsers"
              class="w-full"
              icon="i-lucide-user"
              :ui="{ content: 'min-w-fit' }"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end w-full gap-2">
        <UButton label="取消" variant="ghost" @click="openAssignModal=false"/>
        <UButton label="保存" :loading="submittingAssignUsers" @click="assignForm?.submit()"/>
      </div>
    </template>
  </UModal>
  <UModal v-model:open="openEditModal" :title="editModalTitle">
    <template #body>
      <UForm ref="roleForm" :state="roleState" @submit="submitEditRole" class="space-y-4">
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="角色名称" required>
            <UInput v-model="roleState.name" class="w-full" placeholder="请输入角色名称"/>
          </UFormField>
          <UFormField class="w-full" label="权限字符" required>
            <UInput v-model="roleState.code" class="w-full" placeholder="请输入权限字符"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="排序">
            <UInputNumber v-model="roleState.sort" :min="0" class="w-full"/>
          </UFormField>
          <UFormField class="w-full" label="状态">
            <USelect v-model="roleState.status" valueKey="value" :items="statusOptions" class="w-full"/>
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="数据范围">
          <USelect v-model="roleState.dataScope" valueKey="value" :items="dataScopeOptions" class="w-full"/>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end w-full gap-2">
        <UButton label="取消" variant="ghost" @click="openEditModal=false"/>
        <UButton label="保存" :loading="submittingEditRole" @click="roleForm?.submit()"/>
      </div>
    </template>
  </UModal>
  <UCard>
    <template #header>
      <ActionGroup :table="table" @flush="handleQuery" @add-row="openAddRoleModal"
                   @modify-row="openEditRoleBySelection" @delete-row="deleteRoleBySelection"/>
    </template>
    <UTable ref="table" v-model:column-visibility="columnVisibility" sticky :data="roleList" :columns="columns"/>
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
