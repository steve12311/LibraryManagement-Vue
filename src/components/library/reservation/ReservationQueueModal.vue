<script setup lang="ts">
import { h, resolveComponent } from "vue"
import type { TableColumn } from "@nuxt/ui"
import type { ReservationQueueVO } from "@/api/library/reservation-api"
import {
  getReservationStatusColor,
  getReservationStatusLabel,
} from "@/utils/reservation-status"

const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")
const ULoadingIcon = resolveComponent("ULoadingIcon")

defineProps<{
  open: boolean
  isbn: string
  queue: ReservationQueueVO[]
  loading: boolean
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
}>()

const columns: TableColumn<ReservationQueueVO>[] = [
  {
    id: "position",
    header: "#",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "username",
    header: "用户",
    cell: ({ row }) => h("span", undefined, `${row.original.nickname} (@${row.original.username})`),
  },
  {
    id: "status",
    header: "状态",
    cell: ({ row }) => h(UBadge, { class: "capitalize", variant: "subtle", color: getReservationStatusColor(row.original.status) }, () => getReservationStatusLabel(row.original.status)),
  },
  {
    accessorKey: "createTime",
    header: "预约时间",
  },
]
</script>

<template>
  <UModal
      :open="open"
      :ui="{ content: 'sm:max-w-2xl rounded-2xl border border-default bg-default shadow' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">预约队列</p>
        <p class="system-modal-description">ISBN: {{ isbn }}</p>
      </div>
      <div v-if="loading" class="flex justify-center py-8">
        <ULoadingIcon />
      </div>
      <div v-else-if="queue.length === 0" class="py-8 text-center text-muted">
        暂无预约记录
      </div>
      <UTable v-else :data="queue" :columns="columns" class="mt-4" />
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton @click="emit('update:open', false)" variant="ghost" label="关闭"/>
      </div>
    </template>
  </UModal>
</template>
