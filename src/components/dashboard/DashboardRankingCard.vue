<script setup lang="ts">
import { computed } from "vue"
import type { DashboardHotBook, DashboardNamedCountItem } from "@/api/dashboard-api"

const props = defineProps<{
  title: string
  subtitle: string
  loading?: boolean
  mode: "book" | "count"
  items: DashboardHotBook[] | DashboardNamedCountItem[]
  emptyText?: string
}>()

const bookItems = computed(() => (props.mode === "book" ? props.items as DashboardHotBook[] : []))
const countItems = computed(() => (props.mode === "count" ? props.items as DashboardNamedCountItem[] : []))

function getProgressWidth(items: DashboardNamedCountItem[], currentCount: number) {
  const maxValue = Math.max(...items.map((item) => item.count), 0)
  if (maxValue <= 0) {
    return "0%"
  }
  return `${Math.max((currentCount / maxValue) * 100, 10)}%`
}
</script>

<template>
  <UCard class="rounded-2xl border border-default shadow-sm" :ui="{ body: 'p-5' }">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-highlighted">{{ title }}</h3>
        <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
      </div>
      <UIcon name="i-lucide-badge-percent" class="mt-1 h-5 w-5 text-primary"/>
    </div>

    <div
      v-if="loading"
      class="h-44 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
    />

    <div
      v-else-if="items.length === 0"
      class="flex h-44 items-center justify-center rounded-2xl border border-dashed border-default bg-elevated text-sm text-muted"
    >
      {{ emptyText ?? '暂无排行数据' }}
    </div>

    <div v-else class="space-y-3">
      <template v-if="mode === 'book'">
        <div
          v-for="(item, index) in bookItems"
          :key="`${item.isbn}-${index}`"
          class="flex items-center gap-3 rounded-2xl border border-default bg-elevated/50 p-3"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-default ring-1 ring-default">
            <img
              v-if="item.cover"
              :src="item.cover"
              :alt="item.bookName"
              class="h-full w-full rounded-xl object-cover"
            >
            <UIcon v-else name="i-lucide-book-open" class="h-5 w-5 text-muted"/>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-highlighted">{{ item.bookName }}</p>
                <p class="truncate text-xs text-muted">ISBN {{ item.isbn || "-" }}</p>
              </div>
              <UBadge color="info" variant="subtle">TOP {{ index + 1 }}</UBadge>
            </div>
            <p class="mt-2 text-xs text-muted">近 30 天借阅 {{ item.count }} 次</p>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="(item, index) in countItems"
          :key="`${item.name}-${index}`"
          class="space-y-2 rounded-2xl border border-default bg-elevated/50 p-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-highlighted">{{ item.name }}</p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="soft">TOP {{ index + 1 }}</UBadge>
              <span class="text-sm font-semibold text-highlighted">{{ item.count }}</span>
            </div>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-primary"
              :style="{ width: getProgressWidth(countItems, item.count) }"
            />
          </div>
        </div>
      </template>
    </div>
  </UCard>
</template>
