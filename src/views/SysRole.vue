<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment/moment";
import RoleAPI, {type RolePageQuery, type RolePageVO} from "@/api/role-api.ts"

onMounted(() => {
  handleQuery()
})

const UCheckbox = resolveComponent('UCheckbox')
const USwitch = resolveComponent('USwitch')
const UFieldGroup = resolveComponent('UFieldGroup')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const table = useTemplateRef("table")
const columnVisibility = ref({
  id: false,
})
const total = ref(0);
const queryParams = reactive<RolePageQuery>({
  pageNum: 1,
  pageSize: 10,
});
const roleList = ref<RolePageVO[]>();
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
  <UCard>
    <template #header>
      <ActionGroup @flush="handleQuery" :table="table"/>
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