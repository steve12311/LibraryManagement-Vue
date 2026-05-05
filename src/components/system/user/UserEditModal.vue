<script setup lang="ts">
import type { SelectMenuItem } from "@nuxt/ui";
import type { UserForm } from "@/api/system/user-api.ts";
import FileApi from "@/api/file-api";
import { AVATAR_UPLOAD_ACCEPT, AVATAR_UPLOAD_DESCRIPTION } from "@/constants/file-constants";

const props = defineProps<{
  open: boolean
  title: string
  state: UserForm
  genderOptions: OptionType[]
  roleOptions: SelectMenuItem[]
  loadingRoleOptions: boolean
  avatarModel?: File | null
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:state": [UserForm]
  "update:avatarModel": [File | undefined]
  submit: []
}>()

function updateField<Key extends keyof UserForm>(key: Key, value: UserForm[Key]) {
  emit("update:state", {
    ...props.state,
    [key]: value
  })
}

function updateGender(value: string | number | undefined) {
  updateField("gender", Number(value ?? props.state.gender) as UserForm["gender"])
}

function updateRoleIds(value: Array<string | number> | undefined) {
  updateField("roleIds", Array.isArray(value) ? value.map((item) => Number(item)) : [])
}

function updateAvatarModel(value: File | null | undefined) {
  emit("update:avatarModel", value ?? void 0)
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
        <p class="system-modal-title">用户资料</p>
        <p class="system-modal-description">资料、角色与头像</p>
      </div>
      <UForm class="mt-5 space-y-4">
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="昵称" required>
            <UInput :model-value="state.nickname" class="w-full" placeholder="请输入昵称" @update:model-value="updateField('nickname', $event)" />
          </UFormField>
          <UFormField class="w-full" label="手机号">
            <UInput :model-value="state.mobile" class="w-full" placeholder="请输入手机号" @update:model-value="updateField('mobile', $event)" />
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="性别">
            <USelect :model-value="state.gender" valueKey="value" :items="genderOptions" class="w-full" @update:model-value="updateGender" />
          </UFormField>
          <UFormField class="w-full" label="电子邮箱">
            <UInput :model-value="state.email" class="w-full" type="email" placeholder="请输入电子邮箱" @update:model-value="updateField('email', $event)" />
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="角色" required>
          <USelect
              multiple
              valueKey="value"
              :model-value="state.roleIds"
              :loading="loadingRoleOptions"
              :items="roleOptions"
              class="w-full"
              placeholder="请选择角色"
              @update:model-value="updateRoleIds"
          />
        </UFormField>
        <UFormField class="w-full" label="头像">
          <UFieldGroup class="w-full items-center gap-3">
            <UAvatar size="lg" :src="FileApi.resolveUrl(state.avatar)"/>
            <UFileUpload
                :model-value="avatarModel"
                :accept="AVATAR_UPLOAD_ACCEPT"
                label="上传头像拖到此处"
                :description="AVATAR_UPLOAD_DESCRIPTION"
                class="w-full min-h-24"
                @update:model-value="updateAvatarModel"
            />
          </UFieldGroup>
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
