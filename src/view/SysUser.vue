<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef, watch} from "vue";
import type {InputMenuItem, TableColumn} from "@nuxt/ui";
import {get} from "../api/request.ts"
import moment from "moment";
import type {Page, PageInfo, User, Response} from "../utils/Common.ts";

const UAvatar = resolveComponent('UAvatar')
const USwitch = resolveComponent('USwitch')
const UCheckbox = resolveComponent('UCheckbox')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const pagination = ref<Page>({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})
const title = ref<string>("新增用户")
const accountStatusList = ref<InputMenuItem[]>([
  {
    label: "正常",
    value: 0,
  },
  {
    label: "禁用",
    value: 1,
  }
])
const formData = reactive({
  nickName: "",
  dept: "",
  tel: "",
  email: "",
  userName: "",
  password: "",
  sex: "",
  status: 0,
  post: "",
  role: "",
  remark: "",
})
const dataList = ref<User[]>([])
const table = useTemplateRef('table')
const form = useTemplateRef("form")
const columnVisibility = ref({
  userId: false,
})
const modal = ref<boolean>(false)
const columns = ref<TableColumn<User>[]>([
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
    id: "userId",
    accessorKey: "userId",
    header: "用户ID",
  },
  {
    accessorKey: "nickName",
    header: "用户信息",
    cell: ({row}) => {
      return h('div', {class: 'flex items-center gap-3'}, [
        h(UAvatar, {
          size: "lg",
        }),
        h("div", undefined, [
          h('p', {class: 'font-medium text-highlighted'}, row.original.nickName),
          h('p', {class: ''}, `@${row.original.userName}`)
        ])
      ])
    }
  },
  {
    accessorKey: "deptName",
    header: "部门",
    cell: ({row}) => row.original.deptName
  },
  {
    accessorKey: "phonenumber",
    header: "手机号"
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({row}) => {
      return h(USwitch, {
        modelValue: row.original.status === "0",
        "onUpdate:modelValue": (value: boolean) => {
          console.log(value)
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
      if (row.original.userId === 1) {
        return h('div', undefined, undefined);
      }
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-clipboard-pen-line", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-trash-2", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "重置密码", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-key", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "分配角色", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-id-card-lanyard", variant: "ghost"}),
        ])
      ])
    }
  }
])

watch(pagination.value, getUserList)
onMounted(() => {
  getUserList()
})

async function getUserList() {
  const {data} = await get<Response<PageInfo<User>>>('/system/user/list', {
    params: pagination.value,
  })
  dataList.value = data.data.records
  pagination.value.total = data.data.total
}

function addUser() {
  title.value = "新增用户"
  modal.value = !modal.value
}

function modifyUser() {
  title.value = "修改用户"
  modal.value = !modal.value
}

function cancelSubmit() {
  console.log(form.value?.clear)
  form.value?.clear()
  modal.value = false
}

function confirmForm() {
  form.value?.submit()
  modal.value = false
}

function submitForm() {
  console.log(111)
}
</script>

<template>
  <UModal v-model:open="modal" :dismissible="false" @close="cancelSubmit" :title="title">
    <template #body>
      <UForm ref="form" :state="formData" @submit="submitForm">
        <UFieldGroup class="gap-4 justify-between w-full">
          <UFormField class="w-1/2" label="用户昵称" name="nickName">
            <UInput v-model="formData.nickName" class="w-full"/>
          </UFormField>
          <UFormField class="w-1/2" label="归属部门" name="dept">
            <UInputMenu v-model="formData.dept" class="w-full"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="gap-4 justify-between w-full">
          <UFormField class="w-1/2" label="手机号" name="tel">
            <UInput v-model="formData.tel" type="tel" class="w-full"/>
          </UFormField>
          <UFormField class="w-1/2" label="邮箱" name="email">
            <UInput v-model="formData.email" class="w-full" type="email"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="gap-4 justify-between w-full">
          <UFormField class="w-1/2" label="用户名称" name="userName">
            <UInput v-model="formData.userName" class="w-full"/>
          </UFormField>
          <UFormField class="w-1/2" label="用户密码" name="password">
            <UInput v-model="formData.password" class="w-full" type="password"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="gap-4 justify-between w-full">
          <UFormField class="w-1/2" label="用户性别" name="sex">
            <UInputMenu v-model="formData.sex" class="w-full"/>
          </UFormField>
          <UFormField class="w-1/2" label="账户状态" name="status">
            <URadioGroup class="w-full" orientation="horizontal" v-model="formData.status"
                         :items="accountStatusList"/>
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="gap-4 justify-between w-full">
          <UFormField class="w-1/2" label="岗位" name="post">
            <UInputMenu v-model="formData.post" class="w-full"/>
          </UFormField>
          <UFormField class="w-1/2" label="角色" name="role">
            <UInputMenu v-model="formData.role" class="w-full"/>
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="备注" name="remark">
          <UTextarea v-model="formData.remark" class="w-full"/>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex gap-2 ml-auto">
        <UButton @click="confirmForm" color="info" label="确定"/>
        <UButton @click="cancelSubmit" color="warning" label="取消"/>
      </div>
    </template>
  </UModal>
  <UCard>
    <template #header>
      <ActionGroup :table="table" :modify-disabled="(table?.tableApi.getSelectedRowModel().rows.length??0)>1"
                   @modify-row="modifyUser" @add-row="addUser" @flush="getUserList"/>
    </template>
    <UTable ref="table" v-model:column-visibility="columnVisibility" sticky :data="dataList" :columns="columns"/>
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="pagination.pageNum" :total="pagination.total"
                     :items-per-page="pagination.pageSize"/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>