<script setup lang="ts">
import { resolveComponent } from "vue"

defineProps<{
  open: boolean
  submitting: boolean
  delayDay: number
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  "update:delayDay": [value: number]
  submit: []
}>()

const UInputNumber = resolveComponent("UInputNumber")
const UButton = resolveComponent("UButton")
</script>

<template>
  <UModal
      :open="open"
      title="延期还书"
      :ui="{ content: 'sm:max-w-lg rounded-2xl border border-default bg-default shadow' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">延期归还</p>
        <p class="system-modal-description">顺延预计归还日期</p>
      </div>
      <UForm @submit.prevent="emit('submit')" class="mt-5 space-y-3">
        <UFormField label="延期天数">
          <UInputNumber :model-value="delayDay" :min="1" class="w-full" @update:model-value="(v: unknown) => emit('update:delayDay', v as number)"/>
        </UFormField>
        <p class="text-xs text-muted">将在当前预计归还日期基础上顺延。</p>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton @click="emit('update:open', false)" variant="ghost" label="取消"/>
        <UButton @click="emit('submit')" :loading="submitting" variant="subtle" color="error" label="确定"/>
      </div>
    </template>
  </UModal>
</template>
