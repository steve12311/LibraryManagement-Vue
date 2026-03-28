<script setup lang="ts">
import {computed} from "vue";
import type {PasswordUpdateForm} from "@/api/system/user-api.ts";

const props = defineProps<{
  open: boolean
  state: PasswordUpdateForm
  schema: unknown
  submitting: boolean
  hasPasswordValue: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:state": [PasswordUpdateForm]
  submit: []
  reset: []
}>()

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value)
})

function updateState(patch: Partial<PasswordUpdateForm>) {
  emit("update:state", {
    ...props.state,
    ...patch
  })
}

const oldPasswordModel = computed({
  get: () => props.state.oldPassword,
  set: value => updateState({oldPassword: value})
})

const newPasswordModel = computed({
  get: () => props.state.newPassword,
  set: value => updateState({newPassword: value})
})

const confirmPasswordModel = computed({
  get: () => props.state.confirmPassword,
  set: value => updateState({confirmPassword: value})
})
</script>

<template>
  <UModal v-model:open="openModel" title="修改密码">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit.prevent="emit('submit')">
        <UFormField label="当前密码" name="oldPassword" required>
          <UInput
              v-model="oldPasswordModel"
              type="password"
              class="w-full"
              placeholder="请输入当前密码"
          />
        </UFormField>
        <UFormField label="新密码" name="newPassword" required>
          <UInput
              v-model="newPasswordModel"
              type="password"
              class="w-full"
              placeholder="请输入新密码"
          />
        </UFormField>
        <UFormField label="确认新密码" name="confirmPassword" required>
          <UInput
              v-model="confirmPasswordModel"
              type="password"
              class="w-full"
              placeholder="请再次输入新密码"
          />
        </UFormField>
        <p class="text-xs text-muted">密码长度至少 6 位，建议包含字母和数字。</p>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
            label="取消"
            variant="ghost"
            color="neutral"
            :disabled="submitting"
            @click="emit('update:open', false)"
        />
        <UButton
            label="清空"
            variant="ghost"
            color="neutral"
            :disabled="submitting || !hasPasswordValue"
            @click="emit('reset')"
        />
        <UButton
            label="更新密码"
            icon="i-lucide-key-round"
            :loading="submitting"
            :disabled="submitting"
            @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
