<script setup lang="ts">
import type { UserImportResultVO } from "@/api/system/user-api.ts";

defineProps<{
  open: boolean
  result: UserImportResultVO
  summary: string
}>()

const emit = defineEmits<{
  "update:open": [boolean]
}>()
</script>

<template>
  <UModal
      :open="open"
      title="导入结果"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border border-default bg-default shadow-lg' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">导入完成</p>
        <p class="system-modal-description">{{ summary }}</p>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-default bg-muted/30 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-muted">总条数</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ result.totalCount }}</p>
        </div>
        <div class="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-success">成功</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ result.successCount }}</p>
        </div>
        <div class="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-warning">失败</p>
          <p class="mt-2 text-2xl font-semibold text-highlighted">{{ result.failureCount }}</p>
        </div>
      </div>

      <div class="mt-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-highlighted">失败明细</p>
          <span class="text-xs text-muted">{{ result.messages.length }} 条</span>
        </div>

        <div
            v-if="result.messages.length"
            class="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-default bg-muted/20 px-4 py-3"
        >
          <ul class="space-y-2 text-sm text-default">
            <li v-for="message in result.messages" :key="message" class="leading-6">
              {{ message }}
            </li>
          </ul>
        </div>
        <div
            v-else
            class="mt-3 rounded-2xl border border-default bg-muted/20 px-4 py-6 text-sm text-muted"
        >
          本次导入没有失败明细。
        </div>
      </div>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="关闭" @click="emit('update:open', false)"/>
      </div>
    </template>
  </UModal>
</template>
