<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UFieldGroup = resolveComponent('UFieldGroup')
const UTooltip = resolveComponent('UTooltip')

interface DeptTableRow {
  deptId?: number | string
  deptName?: string
  leader?: string
  status?: number | string
  createTime?: string | Date
  userId?: number | string
  children?: DeptTableRow[]
}

const dataList = ref<DeptTableRow[]>([])
const table = useTemplateRef("table")
const columns = ref<TableColumn<DeptTableRow>[]>([
  {
    accessorKey: "deptId",
    header: "部门编号",
  },
  {
    accessorKey: 'deptName',
    header: '部门名称',
    cell: ({row}) => {
      return h("div", {
        style: {
          paddingLeft: `${row.depth}rem`
        },
        class: 'flex items-center gap-2'
      }, [
        h(UButton, {
          icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
          class: !row.getCanExpand() && 'invisible',
          size: 'xs',
          onClick: row.getToggleExpandedHandler()
        }),
        row.getValue('deptName') as string
      ])
    }
  },
  {
    accessorKey: "leader",
    header: "部门领导"
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({row}) => {
      return h(UBadge, {
            class: 'capitalize',
            variant: 'subtle',
            color: row.getValue('status') === "0" ? "success" : "error"
          }, () =>
              row.getValue('status') === "0" ? "正常" : "停用"
      )
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
    cell: () => {
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-clipboard-pen-line", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-trash-2", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "新增", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-plus", variant: "ghost"}),
        ])
      ])
    }
  }
])
const columnVisibility = ref({
  deptId: false,
})

onMounted(() => {
  getDepList()
})

async function getDepList() {

}
</script>

<template>
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="DEPARTMENT TREE"
          title="部门管理"
          description="查看部门层级、负责人和联系方式，统一维护组织结构。"
          :stats="[
            { label: '顶层部门', value: dataList.length },
            { label: '列数', value: columns.length },
            { label: '展示模式', value: '树表' }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup @flush="getDepList" :table="table"/>
        </template>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
      <UTable ref="table" :column-visibility="columnVisibility" :get-sub-rows="(row) => row.children" :columns="columns"
              :data="dataList" class="h-full" :ui="{
        base: 'border-separate border-spacing-0',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        tr: 'group',
        td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
      }"/>
      </div>
    </div>
  </div>
</template>
