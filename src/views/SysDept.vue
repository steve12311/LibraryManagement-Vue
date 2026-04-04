<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef} from "vue";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";

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
  <UCard
      class="system-page-card flex h-full min-h-0 flex-col"
      :ui="{ header: 'p-6 pb-0', body: 'flex-1 min-h-0 p-6 pt-0' }"
  >
    <template #header>
      <div class="page-header">
        <div class="page-copy">
          <p class="page-kicker">DEPARTMENT TREE</p>
          <h1 class="page-title">部门管理</h1>
          <p class="page-description">查看部门层级、负责人和联系方式，统一维护组织结构。</p>
        </div>
        <div class="page-stats">
          <div class="stat-item">
            <span class="stat-label">顶层部门</span>
            <strong class="stat-value">{{ dataList.length }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">列数</span>
            <strong class="stat-value">{{ columns.length }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">展示模式</span>
            <strong class="stat-value">树表</strong>
          </div>
        </div>
      </div>

      <div class="query-card">
        <div class="action-row">
          <ActionGroup @flush="getDepList" :table="table"/>
        </div>
      </div>
    </template>
    <div class="table-card">
      <UTable ref="table" :column-visibility="columnVisibility" :get-sub-rows="(row) => row.children" :columns="columns"
              :data="dataList" class="h-full" :ui="{
        base: 'border-separate border-spacing-0',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        tr: 'group',
        td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
      }"/>
    </div>
  </UCard>
</template>

<style scoped>
.system-page-card {
  border: 0;
  border-radius: 28px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-kicker,
.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--library-accent);
}

.page-title {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 800;
  color: var(--library-text);
}

.page-description {
  margin-top: 8px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.page-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: min(100%, 320px);
}

.stat-item {
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--library-card-muted);
}

.stat-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  color: var(--library-text);
}

.query-card {
  border-radius: 24px;
  padding: 18px;
  background: rgb(245 249 252 / 88%);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
}

:deep(thead tr) {
  background: rgb(243 247 250 / 92%);
}

:deep(th) {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--library-text-muted);
}

:deep(tbody tr) {
  transition: background-color 180ms ease;
}

:deep(tbody tr:hover) {
  background: rgb(245 249 252 / 82%);
}

@media (max-width: 960px) {
  .page-stats {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>
