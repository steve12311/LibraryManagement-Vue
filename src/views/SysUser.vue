<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";
import UserAPI, {type UserPageQuery, type UserPageVO} from "../api/user-api.ts"

onMounted(() => {
  handleQuery()
})

const UAvatar = resolveComponent('UAvatar')
const USwitch = resolveComponent('USwitch')
const UCheckbox = resolveComponent('UCheckbox')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const queryParams = reactive<UserPageQuery>({
  pageNum: 1,
  pageSize: 10,
});
const total = ref(0);
const pageData = ref<UserPageVO[]>();
const table = useTemplateRef('table')
const columnVisibility = ref({
  id: false,
})
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
    accessorKey: "nickName",
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
    accessorKey: "deptName",
    header: "部门",
    cell: ({row}) => row.original.deptName
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
      if (Number(row.original.id) === 1) {
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
  <UCard>
    <template #header>
      <ActionGroup :table="table" :modify-disabled="(table?.tableApi.getSelectedRowModel().rows.length??0)>1"
                   @flush="handleQuery"/>
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