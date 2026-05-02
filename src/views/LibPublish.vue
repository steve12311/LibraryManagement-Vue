<script setup lang="ts">
import { h, onMounted, ref, resolveComponent, useTemplateRef } from "vue"
import type { TableColumn } from "@nuxt/ui"
import { formatDateTime } from "@/utils/date-format"
import type { PublishForm, PublishId, PublishPageVO } from "@/api/library/publish-api"
import { usePublishQuery } from "@/composables/library/publish/usePublishQuery"
import { usePublishForm } from "@/composables/library/publish/usePublishForm"
import { usePublishDialog } from "@/composables/library/publish/usePublishDialog"
import { usePublishActions } from "@/composables/library/publish/usePublishActions"
import SystemPageHeader from "@/components/system/SystemPageHeader.vue"
import SystemQueryCard from "@/components/system/SystemQueryCard.vue"
import PublishEditModal from "@/components/library/publish/PublishEditModal.vue"

const UCheckbox = resolveComponent("UCheckbox")

onMounted(() => { void handleQuery() })

const { queryParams, searchForm, fieldItems, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData } = usePublishQuery()

const loadingEditPublish = ref(false)
const { createPublishForm, normalizePublishPayload, loadPublishForm } = usePublishForm({
  loadingEditPublish,
})

const submittingPublish = ref(false)
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增出版社")
const editingPublishId = ref<PublishId | undefined>(void 0)
const state = ref<PublishForm>(createPublishForm())

const table = useTemplateRef("table")

function getFirstSelectedRow() {
  return table.value?.tableApi?.getFilteredSelectedRowModel().flatRows?.[0]?.original as { publishId?: PublishId } | undefined
}

function getSelectedRows() {
  return (table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []) as { original: PublishPageVO }[]
}

function toggleAllRows(selected: boolean) {
  table.value?.tableApi?.toggleAllPageRowsSelected(selected)
}

const { open, openAddPublishModal, openEditPublishBySelection } = usePublishDialog({
  loadingEditPublish, submittingPublish, editModalMode, editModalTitle, editingPublishId, state,
  createPublishForm, loadPublishForm, getFirstSelectedRow,
})

const deletingPublish = ref(false)
const { submitForm, deletePublishBySelection } = usePublishActions({
  state, open, editModalMode, editingPublishId, loadingEditPublish, submittingPublish, deletingPublish,
  normalizePublishPayload, fetchData, getSelectedRows, toggleAllRows,
})

const columnVisibility = ref({ publishId: false })

const columns = ref<TableColumn<PublishPageVO>[]>([
  {
    id: "select",
    header: ({ table: t }) => h(UCheckbox, {
      modelValue: t.getIsSomePageRowsSelected() ? "indeterminate" : t.getIsAllPageRowsSelected(),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => t.toggleAllPageRowsSelected(!!value),
      "aria-label": "选择全部",
    }),
    cell: ({ row }) => h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value: boolean | "indeterminate") => row.toggleSelected(!!value),
      "aria-label": "选择单行",
    }),
  },
  { accessorKey: "publishId", header: "ID" },
  { accessorKey: "publishName", header: "出版社名称" },
  { accessorKey: "address", header: "地址" },
  { accessorKey: "addressCode", header: "邮编" },
  { accessorKey: "phonenumber", header: "联系电话" },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({ row }) => formatDateTime(row.original.createTime),
  },
])
</script>

<template>
  <PublishEditModal
      :open="open"
      :title="editModalTitle"
      :state="state"
      :submitting="submittingPublish || loadingEditPublish"
      @update:open="open = $event"
      @update:state="state = $event"
      @submit="submitForm"
  />
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="PUBLISHER"
          title="出版社管理"
          description="出版社名录与联系方式"
          :stats="[
            { label: '记录总数', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '每页条数', value: queryParams.pageSize },
          ]"
      />
      <SystemQueryCard>
        <template #actions>
          <ActionGroup
              :table="table"
              @flush="fetchData"
              @add-row="openAddPublishModal"
              @modify-row="openEditPublishBySelection"
              @delete-row="deletePublishBySelection"
          />
        </template>
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="system-query-row">
            <USelect v-model="searchForm.field" defaultValue="publishName" :items="fieldItems" class="w-28"/>
            <UInput v-model="searchForm.keyword" icon="i-lucide-search" size="md" variant="outline" class="w-full sm:w-72" placeholder="请输入搜索内容..."/>
            <UButton type="submit" icon="i-lucide-search" :loading="loadingPageData" label="搜索"/>
            <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw" :disabled="loadingPageData" label="重置" @click="resetQuery"/>
          </div>
        </UForm>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
        <UTable class="h-full" ref="table" v-model:column-visibility="columnVisibility" sticky :data="pageData" :columns="columns" :loading="loadingPageData" loading-color="primary" loading-animation="carousel"/>
      </div>
    </div>
    <div class="system-page-shell__footer">
      <div class="system-page-footer">
        <p class="system-page-summary">共 {{ total }} 条记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total" :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </div>
  </div>
</template>
