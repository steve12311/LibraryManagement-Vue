<script setup lang="ts">
import { computed } from "vue"
import type {
  DashboardRecentAuthLog,
  DashboardRecentBorrow,
  DashboardRecentOperLog
} from "@/api/dashboard-api"
import {
  getBorrowStatusColor,
  getBorrowStatusLabel
} from "@/utils/borrow-status"

type DashboardRecentEventKind = "borrow" | "oper" | "auth"

const props = defineProps<{
  title: string
  subtitle: string
  kind: DashboardRecentEventKind
  loading?: boolean
  page: number
  pageSize: number
  total: number
  items: Array<DashboardRecentBorrow | DashboardRecentOperLog | DashboardRecentAuthLog>
  emptyText?: string
}>()

const borrowItems = computed(() => (props.kind === "borrow" ? props.items as DashboardRecentBorrow[] : []))
const operItems = computed(() => (props.kind === "oper" ? props.items as DashboardRecentOperLog[] : []))
const authItems = computed(() => (props.kind === "auth" ? props.items as DashboardRecentAuthLog[] : []))

const emit = defineEmits<{
  pageChange: [page: number]
}>()

function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "-"
  }
  const currentDate = new Date(value)
  if (Number.isNaN(currentDate.getTime())) {
    return "-"
  }
  return currentDate.toLocaleString("zh-CN", { hour12: false })
}

function handlePageChange(page: number) {
  emit("pageChange", page)
}
</script>

<template>
  <UCard class="h-full rounded-2xl border border-default shadow-sm" :ui="{ body: 'p-5' }">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-highlighted">{{ title }}</h3>
        <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
      </div>
      <UIcon name="i-lucide-history" class="mt-1 h-5 w-5 text-cyan-600"/>
    </div>

    <div
      v-if="loading"
      class="h-80 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
    />

    <div
      v-else-if="items.length === 0"
      class="flex h-80 items-center justify-center rounded-2xl border border-dashed border-default bg-elevated text-sm text-muted"
    >
      {{ emptyText ?? '暂无事件数据' }}
    </div>

    <div v-else class="flex h-full flex-col">
      <div class="space-y-3">
        <template v-if="kind === 'borrow'">
          <div
            v-for="item in borrowItems"
            :key="item.borrowId"
            class="rounded-2xl border border-default bg-elevated/50 p-3"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-default">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  :alt="item.bookName"
                  class="h-full w-full object-cover"
                >
                <UIcon v-else name="i-lucide-book-open" class="h-5 w-5 text-muted"/>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="truncate text-sm font-medium text-highlighted">{{ item.bookName }}</p>
                  <UBadge :color="getBorrowStatusColor(item.status)" variant="subtle">
                    {{ getBorrowStatusLabel(item.status) }}
                  </UBadge>
                </div>
                <div class="mt-2 grid gap-1 text-xs text-muted">
                  <p>读者：{{ item.username }}</p>
                  <p>借阅时间：{{ formatDateTime(item.createTime) }}</p>
                  <p>应还时间：{{ formatDateTime(item.returnTime) }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="kind === 'oper'">
          <div
            v-for="item in operItems"
            :key="item.logId"
            class="rounded-2xl border border-default bg-elevated/50 p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-medium text-highlighted">{{ item.module }} · {{ item.action }}</p>
              <UBadge :color="item.success === 1 ? 'success' : 'error'" variant="subtle">
                {{ item.success === 1 ? "成功" : "失败" }}
              </UBadge>
            </div>
            <div class="mt-2 grid gap-1 text-xs text-muted">
              <p>操作人：{{ item.operatorUsername }}</p>
              <p>结果码：{{ item.resultCode }}</p>
              <p>时间：{{ formatDateTime(item.createTime) }}</p>
            </div>
          </div>
        </template>

        <template v-else>
          <div
            v-for="item in authItems"
            :key="item.logId"
            class="rounded-2xl border border-default bg-elevated/50 p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-medium text-highlighted">{{ item.username || "匿名用户" }}</p>
              <UBadge color="error" variant="subtle">{{ item.resultCode }}</UBadge>
            </div>
            <div class="mt-2 grid gap-1 text-xs text-muted">
              <p>事件：{{ item.eventType }}</p>
              <p>IP：{{ item.clientIp }}</p>
              <p>失败摘要：{{ item.failureSummary }}</p>
              <p>时间：{{ formatDateTime(item.createTime) }}</p>
            </div>
          </div>
        </template>
      </div>

      <div v-if="total > pageSize" class="mt-4 flex justify-center">
        <UPagination
          :page="page"
          :total="total"
          :items-per-page="pageSize"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </UCard>
</template>
