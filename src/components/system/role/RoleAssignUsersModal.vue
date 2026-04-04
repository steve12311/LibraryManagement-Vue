<script setup lang="ts">
import type {SelectMenuItem} from "@nuxt/ui";

const props = defineProps<{
  open: boolean
  roleName: string
  userOptions: SelectMenuItem[]
  userIds: Array<string | number>
  loading: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:userIds": [Array<string | number>]
  submit: []
}>()

function updateUserIds(value: Array<string | number> | undefined) {
  emit("update:userIds", value ?? [])
}
</script>

<template>
  <UModal
      :open="open"
      :title="`分配用户${roleName ? ` - ${roleName}` : ''}`"
      :ui="{ content: 'sm:max-w-xl rounded-[28px] border border-default bg-default shadow-lg' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">分配用户</p>
        <p class="system-modal-description">将选中的用户纳入当前角色。</p>
      </div>
      <UForm class="mt-5 space-y-4">
        <UFormField class="w-full" label="用户" required>
          <USelectMenu
              multiple
              valueKey="value"
              :model-value="props.userIds"
              :items="userOptions"
              :loading="loading"
              class="w-full"
              icon="i-lucide-user"
              :ui="{ content: 'min-w-fit' }"
              @update:model-value="updateUserIds"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="emit('update:open', false)" />
        <UButton label="保存" :loading="submitting" @click="emit('submit')" />
      </div>
    </template>
  </UModal>
</template>
