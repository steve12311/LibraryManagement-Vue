<script setup lang="ts">
import { h, onMounted, ref, resolveComponent, useTemplateRef } from "vue"
import type { TableColumn } from "@nuxt/ui"
import { formatDateTime } from "@/utils/date-format"
import type { AdminReservationPageVO } from "@/api/library/reservation-api"
import {
  getReservationStatusColor,
  getReservationStatusLabel,
  isReservationCancellable,
  isReservationPickupable,
} from "@/utils/reservation-status"
import type { ReservationStatusValue } from "@/enums/system/reservation-status-enum"
import { useReservationQuery } from "@/composables/library/reservation/useReservationQuery"
import { useReservationActions } from "@/composables/library/reservation/useReservationActions"
import SystemPageHeader from "@/components/system/SystemPageHeader.vue"
import SystemQueryCard from "@/components/system/SystemQueryCard.vue"
import ReservationQueueModal from "@/components/library/reservation/ReservationQueueModal.vue"
import FileApi from "@/api/file-api.ts"

const UAvatar = resolveComponent("UAvatar")
const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")
const UTooltip = resolveComponent("UTooltip")
const UFieldGroup = resolveComponent("UFieldGroup")

const { queryParams, searchForm, fieldItems, statusItems, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData } = useReservationQuery()

const {
  confirmPickup,
  cancelReservation,
  viewQueue,
  queueData,
  queueLoading,
  queueModalOpen,
  queueIsbn,
} = useReservationActions({ fetchData })

const table = useTemplateRef("table")

onMounted(() => {
  void handleQuery()
})

const columns = ref<TableColumn<AdminReservationPageVO>[]>([
  {
    accessorKey: "id",
    header: "预约订单",
    cell: ({ row }) => row.original.id.slice(0, 8),
  },
  { accessorKey: "isbn", header: "ISBN" },
  { accessorKey: "bookName", header: "名称" },
  {
    id: "userInfo",
    header: "预约用户",
    cell: ({ row }) => h("div", { class: "flex items-center gap-3" }, [
      h(UAvatar, { size: "lg", src: FileApi.resolveUrl(row.original.avatar) }),
      h("div", undefined, [
        h("p", { class: "font-medium text-highlighted" }, row.original.nickname),
        h("p", undefined, `@${row.original.username}`),
      ]),
    ]),
  },
  {
    id: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.original.status as ReservationStatusValue
      return h(UBadge, { class: "capitalize", variant: "subtle", color: getReservationStatusColor(status) }, () => getReservationStatusLabel(status))
    },
  },
  {
    accessorKey: "pickupDeadline",
    header: "取书截止",
    cell: ({ row }) => formatDateTime(row.original.pickupDeadline),
  },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({ row }) => formatDateTime(row.original.createTime),
  },
  {
    id: "action",
    header: "操作",
    cell: ({ row }) => {
      const status = row.original.status as ReservationStatusValue
      const buttons: ReturnType<typeof h>[] = []

      if (isReservationPickupable(status)) {
        buttons.push(
          h(UTooltip, { text: "确认取书", delayDuration: 0 }, () =>
            h(UButton, {
              icon: "i-lucide-check-circle",
              variant: "ghost",
              onClick: (ev: Event) => { ev.stopPropagation(); void confirmPickup(row.original.id) },
            }),
          ),
        )
      }

      if (isReservationCancellable(status)) {
        buttons.push(
          h(UTooltip, { text: "取消预约", delayDuration: 0 }, () =>
            h(UButton, {
              icon: "i-lucide-x-circle",
              variant: "ghost",
              color: "error",
              onClick: (ev: Event) => { ev.stopPropagation(); void cancelReservation(row.original.id) },
            }),
          ),
        )
      }

      buttons.push(
        h(UTooltip, { text: "查看队列", delayDuration: 0 }, () =>
          h(UButton, {
            icon: "i-lucide-list",
            variant: "ghost",
            onClick: (ev: Event) => { ev.stopPropagation(); void viewQueue(row.original.isbn) },
          }),
        ),
      )

      return h(UFieldGroup, undefined, () => buttons)
    },
  },
])
</script>

<template>
  <ReservationQueueModal
      v-model:open="queueModalOpen"
      :isbn="queueIsbn"
      :queue="queueData"
      :loading="queueLoading"
  />
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="RESERVATION"
          title="预约管理"
          description="预约查询、取书确认与取消"
          :stats="[
            { label: '预约记录', value: total },
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
