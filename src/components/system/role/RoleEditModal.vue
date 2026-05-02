<script setup lang="ts">
import type {RoleDataScope, RoleForm, RoleStatus} from "@/api/system/role-api.ts";

const props = defineProps<{
  open: boolean
  title: string
  state: RoleForm
  statusOptions: OptionType[]
  dataScopeOptions: OptionType[]
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:state": [RoleForm]
  submit: []
}>()

function updateField<Key extends keyof RoleForm>(key: Key, value: RoleForm[Key]) {
  emit("update:state", {
    ...props.state,
    [key]: value
  })
}

function updateStatus(value: string | number | undefined) {
  updateField("status", Number(value ?? props.state.status) as RoleStatus)
}

function updateDataScope(value: string | number | undefined) {
  updateField("dataScope", Number(value ?? props.state.dataScope) as RoleDataScope)
}
</script>

<template>
  <UModal
      :open="open"
      :title="title"
      :ui="{ content: 'sm:max-w-2xl rounded-2xl border border-default bg-default shadow' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">角色资料</p>
        <p class="system-modal-description">角色名称、权限字符与数据范围</p>
      </div>
      <UForm class="mt-5 space-y-4">
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="角色名称" required>
            <UInput :model-value="state.name" class="w-full" placeholder="请输入角色名称" @update:model-value="updateField('name', $event)" />
          </UFormField>
          <UFormField class="w-full" label="权限字符" required>
            <UInput :model-value="state.code" class="w-full" placeholder="请输入权限字符" @update:model-value="updateField('code', $event)" />
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="排序">
            <UInputNumber :model-value="state.sort" :min="0" class="w-full" @update:model-value="updateField('sort', Number($event ?? 0))" />
          </UFormField>
          <UFormField class="w-full" label="状态">
            <USelect :model-value="state.status" value-key="value" :items="statusOptions" class="w-full" @update:model-value="updateStatus" />
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="数据范围">
          <USelect :model-value="state.dataScope" value-key="value" :items="dataScopeOptions" class="w-full" @update:model-value="updateDataScope" />
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
