<script setup lang="ts">
const open = defineModel<boolean>('open', {default: false})
const stockOutNumber = defineModel<number>('stockOutNumber', {default: 0})

withDefaults(defineProps<{
  submitting?: boolean
}>(), {
  submitting: false
})

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <UModal v-model:open="open" title="图书出库">
    <template #body>
      <UFormField class="w-full" label="出库数量">
        <UInputNumber v-model="stockOutNumber" :min="0" class="w-full"/>
      </UFormField>
    </template>
    <template #footer>
      <div class="w-full flex justify-end gap-2">
        <UButton label="取消" variant="ghost" @click="open = false"/>
        <UButton label="确定" :loading="submitting" @click="emit('submit')"/>
      </div>
    </template>
  </UModal>
</template>
