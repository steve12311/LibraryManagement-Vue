<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type {AcceptableValue, SelectItem, TableColumn} from "@nuxt/ui";
import type { ReservationPageVO } from "@/api/library/reservation-api.ts";
import type {ReservationStatusColor, ReservationStatusFilterValue} from "@/enums/system/reservation-status-enum";

const props = defineProps<{
  loading: boolean
  reservations: ReservationPageVO[]
  total: number
  page: number
  pageSize: number
  statusFilter: ReservationStatusFilterValue
  statusItems: SelectItem[]
  getReservationStatusLabel: (status: ReservationPageVO["status"]) => string
  getReservationStatusColor: (status: ReservationPageVO["status"]) => ReservationStatusColor
  formatDateTime: (value?: string) => string
  getDaysRemaining: (pickupDeadline?: string | null) => number | null
  isCancellable: (status: ReservationPageVO["status"]) => boolean
}>()

const emit = defineEmits<{
  "update:statusFilter": [ReservationStatusFilterValue]
  query: []
  reset: []
  refresh: []
  pageChange: [number]
  cancel: [string]
}>()

const UBadge = resolveComponent("UBadge")
function updateStatusFilter(value: AcceptableValue | undefined) {
  emit("update:statusFilter", Number(value ?? -1) as ReservationStatusFilterValue)
}

const reservationColumns = [
  {
    id: "book",
    header: "图书信息",
    cell: ({ row }: { row: { original: ReservationPageVO } }) => {
      const cover = row.original.cover
      return h("div", { class: "flex min-w-0 items-center gap-3" }, [
        cover
            ? h("img", {
              src: cover,
              alt: row.original.bookName,
              class: "h-14 w-10 rounded-xl border border-default bg-elevated object-cover"
            })
            : h("div", {
              class: "flex h-14 w-10 items-center justify-center rounded-xl border border-default bg-elevated text-[10px] text-muted"
            }, "暂无封面"),
        h("div", { class: "min-w-0 space-y-1" }, [
          h("p", { class: "truncate font-medium text-highlighted" }, row.original.bookName || "-"),
          h("p", { class: "text-xs text-muted" }, `ISBN ${row.original.isbn || "-"}`)
        ])
      ])
    }
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }: { row: { original: ReservationPageVO } }) => {
      const children = []
      children.push(props.getReservationStatusLabel(row.original.status))
      if (row.original.status === 1) {
        const days = props.getDaysRemaining(row.original.pickupDeadline)
        if (days !== null) {
          children.push(` 还剩 ${days} 天`)
        }
      }
      return h(UBadge, {
        color: props.getReservationStatusColor(row.original.status),
        variant: "subtle",
        class: "capitalize",
      }, () => children.join(""))
    }
  },
  {
    accessorKey: "pickupDeadline",
    header: "取书截止时间",
    cell: ({ row }: { row: { original: ReservationPageVO } }) => {
      if (row.original.status !== 1) return "-"
      return props.formatDateTime(row.original.pickupDeadline ?? undefined)
    },
  },
  {
    accessorKey: "createTime",
    header: "预约时间",
    cell: ({ row }: { row: { original: ReservationPageVO } }) => props.formatDateTime(row.original.createTime),
  },
  {
    id: "action",
    header: "操作",
    cell: ({ row }: { row: { original: ReservationPageVO } }) => {
      if (!props.isCancellable(row.original.status)) return h("span", { class: "text-xs text-muted" }, "-")
      return h(resolveComponent("UButton"), {
        color: "error",
        variant: "soft",
        size: "xs",
        onClick: () => emit("cancel", row.original.id),
      }, () => "取消预约")
    }
  }
] as TableColumn<ReservationPageVO>[]
</script>

<template>
  <UCard class="borrow-card">
    <template #header>
      <div class="borrow-header">
        <div>
          <p class="borrow-title">我的预约</p>
        </div>
        <div class="borrow-actions">
          <USelect
              :model-value="statusFilter"
              :items="statusItems"
              class="w-32"
              @update:model-value="updateStatusFilter"
          />
          <UButton icon="i-lucide-filter" variant="soft" :loading="loading" @click="emit('query')">
            筛选
          </UButton>
          <UButton variant="ghost" color="neutral" :disabled="loading" @click="emit('reset')">
            重置
          </UButton>
          <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              color="neutral"
              :loading="loading"
              @click="emit('refresh')"
          >
            刷新列表
          </UButton>
        </div>
      </div>
    </template>

    <div v-if="loading" class="borrow-loading">
      <div v-for="item in 4" :key="item" class="loading-block h-16" />
    </div>
    <div v-else-if="reservations.length === 0" class="borrow-empty">
      <p class="text-base font-medium text-highlighted">暂无预约记录</p>
      <p class="mt-1 text-sm text-muted">当前筛选条件下没有查到预约记录。</p>
    </div>
    <UTable
        v-else
        class="h-full"
        :data="reservations"
        :columns="reservationColumns"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
    />

    <template #footer>
      <div class="borrow-footer">
        <p class="text-xs text-muted">共 {{ total }} 条预约记录</p>
        <UPagination
            v-if="total > pageSize"
            :page="page"
            :total="total"
            :items-per-page="pageSize"
            @update:page="emit('pageChange', $event)"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.borrow-card {
  border: 1px solid var(--library-border);
  border-radius: 28px;
  background: var(--library-card);
  box-shadow: var(--library-shadow-soft);
}

.borrow-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.borrow-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--library-text);
}

.borrow-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.borrow-loading {
  display: grid;
  gap: 12px;
  padding: 24px 28px 28px;
}

.loading-block {
  border-radius: 18px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--library-card-muted) 86%, transparent) 0%, var(--library-card) 100%);
  animation: pulse 1.4s ease-in-out infinite;
}

.borrow-empty {
  border: 1px dashed var(--library-border-strong);
  border-radius: 20px;
  padding: 2.5rem 1rem;
  text-align: center;
  background: color-mix(in srgb, var(--library-card) 82%, var(--library-card-muted));
}

.borrow-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
