<script setup lang="ts">
import type { PublishForm } from "@/api/library/publish-api"

defineProps<{
  open: boolean
  title: string
  state: PublishForm
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  "update:state": [value: PublishForm]
  submit: []
}>()
</script>

<template>
  <UModal
      :open="open"
      :title="title"
      :ui="{ content: 'sm:max-w-3xl rounded-2xl border border-default bg-default shadow' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">出版社资料</p>
        <p class="system-modal-description">名称、联系方式与地址</p>
      </div>
      <UForm @submit.prevent="emit('submit')" class="mt-5 space-y-4">
        <div class="publish-modal-grid">
          <UFormField class="w-full" label="名称" name="name" required>
            <UInput class="w-full" :model-value="state.name" placeholder="请输入出版社名称" @update:model-value="(v: unknown) => emit('update:state', { ...state, name: String((v as string) ?? '') })"/>
          </UFormField>
          <UFormField class="w-full" label="联系电话" name="telephone">
            <UInput class="w-full" :model-value="state.telephone" placeholder="请输入联系电话" @update:model-value="(v: unknown) => emit('update:state', { ...state, telephone: String((v as string) ?? '') })"/>
          </UFormField>
        </div>
        <div class="publish-modal-grid">
          <UFormField class="w-full" label="电子邮箱" name="email">
            <UInput :model-value="state.email" class="w-full" type="email" placeholder="请输入电子邮箱" @update:model-value="(v: unknown) => emit('update:state', { ...state, email: String((v as string) ?? '') })"/>
          </UFormField>
          <UFormField class="w-full" label="邮编" name="postalCode">
            <UInput class="w-full" :model-value="state.postalCode" placeholder="请输入邮编" @update:model-value="(v: unknown) => emit('update:state', { ...state, postalCode: String((v as string) ?? '') })"/>
          </UFormField>
        </div>
        <UFormField class="w-full" label="地址">
          <div class="publish-address-grid">
            <UInput :model-value="state.country" placeholder="国家" @update:model-value="(v: unknown) => emit('update:state', { ...state, country: String((v as string) ?? '') })"/>
            <UInput :model-value="state.province" placeholder="省" @update:model-value="(v: unknown) => emit('update:state', { ...state, province: String((v as string) ?? '') })"/>
            <UInput :model-value="state.city" placeholder="市" @update:model-value="(v: unknown) => emit('update:state', { ...state, city: String((v as string) ?? '') })"/>
            <UInput :model-value="state.area" placeholder="区/县" @update:model-value="(v: unknown) => emit('update:state', { ...state, area: String((v as string) ?? '') })"/>
            <UInput :model-value="state.areaDetail" placeholder="街道" @update:model-value="(v: unknown) => emit('update:state', { ...state, areaDetail: String((v as string) ?? '') })"/>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton @click="emit('update:open', false)" variant="ghost" label="取消"/>
        <UButton @click="emit('submit')" :loading="submitting" variant="subtle" color="error" label="保存"/>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.publish-modal-grid {
  display: grid;
  gap: 0.75rem;
}
.publish-address-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
@media (min-width: 768px) {
  .publish-modal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 640px) {
  .publish-address-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .publish-address-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
