<script setup lang="ts">
import { h, onMounted, ref, resolveComponent, useTemplateRef } from "vue"
import type { TableColumn } from "@nuxt/ui"
import { formatDate } from "@/utils/date-format"
import type { BorrowPageVO } from "@/api/library/borrow-api"
import {
  getBorrowStatusColor,
  getBorrowStatusLabel,
  isBorrowReturned,
  resolveBorrowStatus,
} from "@/utils/borrow-status"
import type { BorrowStatusValue } from "@/enums/system/borrow-status-enum"
import { useBorrowQuery } from "@/composables/library/borrow/useBorrowQuery"
import { useBorrowForm } from "@/composables/library/borrow/useBorrowForm"
import { useBorrowDialog } from "@/composables/library/borrow/useBorrowDialog"
import { useBorrowActions } from "@/composables/library/borrow/useBorrowActions"
import SystemPageHeader from "@/components/system/SystemPageHeader.vue"
import SystemQueryCard from "@/components/system/SystemQueryCard.vue"
import BorrowEditModal from "@/components/library/borrow/BorrowEditModal.vue"
import BorrowDelayModal from "@/components/library/borrow/BorrowDelayModal.vue"

const UAvatar = resolveComponent("UAvatar")
const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")
const UTooltip = resolveComponent("UTooltip")
const UFieldGroup = resolveComponent("UFieldGroup")

const { queryParams, searchForm, fieldItems, statusItems, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData } = useBorrowQuery()

const { state, returnTime, userOptions, bookOptions, loadingBorrowOptions, parseDate, resetBorrowForm, fetchUserOptions, fetchBookOptions } = useBorrowForm()

const submittingBorrow = ref(false)
const submittingDelay = ref(false)
const returningBorrowId = ref("")

const { open, openConfirm, selectedDelayBorrowId, selectedDelayReturnTime, delayDay, openCreateModal, openDelayModal } = useBorrowDialog({
  loadingBorrowOptions,
  submittingBorrow,
  submittingDelay,
  resetBorrowForm,
  fetchUserOptions,
  fetchBookOptions,
  parseDate,
})

const { submitForm, submitDelayDay, confirmReturnBorrow } = useBorrowActions({
  state, returnTime, open, openConfirm,
  selectedDelayBorrowId, selectedDelayReturnTime, delayDay,
  submittingBorrow, submittingDelay, returningBorrowId,
  fetchData,
})

const table = useTemplateRef("table")

onMounted(() => {
  void handleQuery()
})

function getRowBorrowStatus(row: BorrowPageVO): BorrowStatusValue {
  return resolveBorrowStatus(row.returnTime, row.realityReturnTime)
}

const columns = ref<TableColumn<BorrowPageVO>[]>([
  { accessorKey: "borrowId", header: "借阅订单" },
  { accessorKey: "isbn", header: "ISBN" },
  { accessorKey: "bookName", header: "名称" },
  {
    id: "userInfo",
    header: "借阅用户",
    cell: ({ row }) => h("div", { class: "flex items-center gap-3" }, [
      h(UAvatar, { size: "lg", src: row.original.avatar }),
      h("div", undefined, [
        h("p", { class: "font-medium text-highlighted" }, row.original.nickname),
        h("p", undefined, `@${row.original.username}`),
      ]),
    ]),
  },
  {
    accessorKey: "returnTime",
    header: "预计归还日期",
    cell: ({ row }) => formatDate(row.original.returnTime),
  },
  {
    id: "status",
    header: "状态",
    cell: ({ row }) => {
      const s = getRowBorrowStatus(row.original)
      return h(UBadge, { class: "capitalize", variant: "subtle", color: getBorrowStatusColor(s) }, () => getBorrowStatusLabel(s))
    },
  },
  {
    id: "action",
    header: "操作",
    cell: ({ row }) => {
      if (isBorrowReturned(getRowBorrowStatus(row.original))) return
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, { text: "延长时间", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-calendar-clock",
            variant: "ghost",
            onClick: (ev: Event) => { ev.stopPropagation(); openDelayModal(row.original) },
          }),
        ]),
        h(UTooltip, { text: "归还图书", delayDuration: 0 }, () => [
          h(UButton, {
            icon: "i-lucide-book-down",
            variant: "ghost",
            loading: returningBorrowId.value === row.original.borrowId,
            onClick: (ev: Event) => { ev.stopPropagation(); void confirmReturnBorrow(row.original.borrowId) },
          }),
        ]),
      ])
    },
  },
])
</script>

<template>
  <BorrowDelayModal
      v-model:open="openConfirm"
      v-model:delay-day="delayDay"
      :submitting="submittingDelay"
      @submit="submitDelayDay"
  />
  <BorrowEditModal
      v-model:open="open"
      v-model:state="state"
      v-model:return-time="returnTime"
      :loading="loadingBorrowOptions"
      :submitting="submittingBorrow"
      :user-options="userOptions"
      :book-options="bookOptions"
      @submit="submitForm"
  />
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="BORROW"
          title="借阅管理"
          description="借阅查询、延期与还书处理"
          :stats="[
            { label: '借阅记录', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '当前模式', value: searchForm.field === 'status' ? '状态' : '关键词' },
          ]"
      />
      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="table" @flush="fetchData">
            <UForm @submit.prevent="handleQuery" class="w-full">
              <div class="system-query-row">
                <USelect v-model="searchForm.field" defaultValue="isbn" :items="fieldItems" class="w-28"/>
                <USelect v-if="searchForm.field === 'status'" v-model="searchForm.status" class="w-32" :items="statusItems"/>
                <UInput
                    v-else
                    v-model="searchForm.keyword"
                    icon="i-lucide-search"
                    size="md"
                    variant="outline"
                    class="w-full sm:w-72"
                    placeholder="请输入搜索内容..."
                />
                <UButton type="submit" icon="i-lucide-search" :loading="loadingPageData" label="搜索"/>
                <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw" :disabled="loadingPageData" label="重置" @click="resetQuery"/>
              </div>
            </UForm>
            <template #behind>
              <UButton @click="openCreateModal" :loading="loadingBorrowOptions" icon="i-lucide-plus" variant="subtle" label="新增"/>
            </template>
          </ActionGroup>
        </template>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
        <UTable class="h-full" ref="table" sticky :data="pageData" :columns="columns" :loading="loadingPageData" loading-color="primary" loading-animation="carousel"/>
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
