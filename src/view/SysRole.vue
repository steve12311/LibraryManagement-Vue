<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef} from "vue";
import {get} from "../api/request.ts";
import type {Page, PageInfo, Response, Role} from "../utils/Common.ts";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment/moment";

const UCheckbox = resolveComponent('UCheckbox')
const USwitch = resolveComponent('USwitch')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const table = useTemplateRef("table")
const columnVisibility = ref({
  roleId: false,
})
const pagination = ref<Page>({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})
const dataList = ref<Role[]>([])
const columns = ref<TableColumn<Role>[]>([
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
    id: "roleId",
    accessorKey: "roleId",
    header: "角色ID",
  },
  {
    id: "roleName",
    accessorKey: "roleName",
    header: "角色名称",
  },
  {
    id: "roleKey",
    accessorKey: "roleKey",
    header: "权限字符",
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
      if (row.original.roleId === 0) {
        return h('div', undefined, undefined);
      }
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-clipboard-pen-line", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-trash-2", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "数据权限", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-lock-keyhole", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "分配用户", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-user", variant: "ghost"}),
        ])
      ])
    }
  }
])

onMounted(() => {
  getRoleList()
})

async function getRoleList() {
  const {data} = await get<Response<PageInfo<Role>>>('/system/role/list', {
    params: pagination.value,
  })
  dataList.value = data.data.records
  pagination.value.total = data.data.total
}
</script>

<template>
  <UCard>
    <template #header>
      <ActionGroup @flush="getRoleList" :table="table"/>
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