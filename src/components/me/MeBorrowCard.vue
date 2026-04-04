<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type {AcceptableValue, SelectItem, TableColumn} from "@nuxt/ui";
import type { MyBorrowPageVO } from "@/api/system/user-api.ts";
import type {BorrowStatusColor, BorrowStatusFilterValue} from "@/enums/system/borrow-status-enum";

const props = defineProps<{
  loading: boolean
  orders: MyBorrowPageVO[]
  total: number
  page: number
  pageSize: number
  statusFilter: BorrowStatusFilterValue
  statusItems: SelectItem[]
  getBorrowStatusLabel: (status: MyBorrowPageVO["status"]) => string
  getBorrowStatusColor: (status: MyBorrowPageVO["status"]) => BorrowStatusColor
  formatBorrowReturnTime: (value?: MyBorrowPageVO["returnTime"]) => string
}>()

const emit = defineEmits<{
  "update:statusFilter": [BorrowStatusFilterValue]
  query: []
  reset: []
  refresh: []
  pageChange: [number]
}>()

const UBadge = resolveComponent("UBadge")
function updateStatusFilter(value: AcceptableValue | undefined) {
  emit("update:statusFilter", Number(value ?? -1) as BorrowStatusFilterValue)
}

const borrowColumns = [
  {
    id: "book",
    header: "图书信息",
    cell: ({ row }: { row: { original: MyBorrowPageVO } }) => {
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
    accessorKey: "borrowId",
    header: "借阅单号",
  },
  {
    accessorKey: "returnTime",
    header: "应还时间",
    cell: ({ row }: { row: { original: MyBorrowPageVO } }) => props.formatBorrowReturnTime(row.original.returnTime),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }: { row: { original: MyBorrowPageVO } }) => {
      return h(UBadge, {
        color: props.getBorrowStatusColor(row.original.status),
        variant: "subtle",
        class: "capitalize",
      }, () => props.getBorrowStatusLabel(row.original.status))
    }
  }
] as TableColumn<MyBorrowPageVO>[]
</script>

<template>
  <UCard class="borrow-card">
    <template #header>
      <div class="borrow-header">
        <div>
          <p class="borrow-title">我的借阅订单</p>
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
    <div v-else-if="orders.length === 0" class="borrow-empty">
      <p class="text-base font-medium text-highlighted">暂无借阅订单</p>
      <p class="mt-1 text-sm text-muted">当前筛选条件下没有查到借阅记录。</p>
    </div>
    <UTable
        v-else
        class="h-full"
        :data="orders"
        :columns="borrowColumns"
        :loading="loading"
        loading-color="primary"
        loading-animation="carousel"
    />

    <template #footer>
      <div class="borrow-footer">
        <p class="text-xs text-muted">共 {{ total }} 条借阅记录</p>
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
