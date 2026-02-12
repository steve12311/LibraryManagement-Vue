<script setup lang="ts">
defineProps<{
  content: string
}>()
const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal title="警告" :close="{ onClick: () => emit('close', false) }">
    <template #body>
      {{ content }}
    </template>
    <template #footer>
      <UButton label="取消" @click="emit('close', false)" />
      <UButton label="确定" @click="emit('close', true)" color="error" variant="outline" />
    </template>
  </UModal>
</template>

<style scoped>

</style>