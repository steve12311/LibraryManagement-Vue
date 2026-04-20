<script setup lang="ts">
import type { SelectMenuItem } from "@nuxt/ui";
import type { UserForm } from "@/api/system/user-api.ts";

const props = defineProps<{
  open: boolean
  username: string
  state: UserForm
  roleOptions: SelectMenuItem[]
  loadingRoleOptions: boolean
  loadingAssignRole: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:state": [UserForm]
  submit: []
}>()

function updateRoleIds(value: Array<string | number> | undefined) {
  emit("update:state", {
    ...props.state,
    roleIds: Array.isArray(value) ? value.map((item) => Number(item)) : []
  })
}
</script>

<template>
  <UModal
      :open="open"
      :title="`分配角色${username ? ` - ${username}` : ''}`"
      :ui="{ content: 'sm:max-w-xl rounded-[28px] border border-default bg-default shadow-lg' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">角色分配</p>
        <p class="system-modal-description">为当前用户调整角色集合，保存后立即更新权限范围。</p>
      </div>
      <UForm class="mt-5 space-y-4">
        <UFormField class="w-full" label="角色">
          <USelect
              multiple
              valueKey="value"
              :model-value="state.roleIds"
              :loading="loadingRoleOptions || loadingAssignRole"
              :items="roleOptions"
              class="w-full"
              placeholder="请选择角色"
              @update:model-value="updateRoleIds"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="emit('update:open', false)"/>
        <UButton label="保存" :loading="submitting" @click="emit('submit')"/>
      </div>
    </template>
  </UModal>
</template>
