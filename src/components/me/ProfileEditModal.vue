<script setup lang="ts">
import {computed} from "vue";
import type {UserProfileForm} from "@/api/system/user-api.ts";
import FileApi from "@/api/file-api";
import { AVATAR_UPLOAD_ACCEPT, AVATAR_UPLOAD_DESCRIPTION } from "@/constants/file-constants";

const props = defineProps<{
  open: boolean
  state: UserProfileForm
  schema: unknown
  genderOptions: OptionType[]
  loading: boolean
  submitting: boolean
  avatarModel?: File
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:state": [UserProfileForm]
  "update:avatarModel": [File | undefined]
  submit: []
  reset: []
}>()

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value)
})

const avatarModel = computed({
  get: () => props.avatarModel,
  set: (value: File | undefined) => emit("update:avatarModel", value)
})

function updateState(patch: Partial<UserProfileForm>) {
  emit("update:state", {
    ...props.state,
    ...patch
  })
}

const nicknameModel = computed({
  get: () => props.state.nickname,
  set: value => updateState({nickname: value})
})

const genderModel = computed({
  get: () => props.state.gender,
  set: value => updateState({gender: value})
})

const mobileModel = computed({
  get: () => props.state.mobile,
  set: value => updateState({mobile: value})
})

const emailModel = computed({
  get: () => props.state.email,
  set: value => updateState({email: value})
})
</script>

<template>
  <UModal
      v-model:open="openModel"
      title="编辑资料"
      :ui="{ content: 'sm:max-w-2xl rounded-2xl border border-default bg-default shadow' }"
  >
    <template #body>
      <div class="modal-copy">
        <p class="modal-title">基础资料</p>
        <p class="modal-description">头像、昵称与联系方式</p>
      </div>
      <UForm :schema="schema" :state="state" class="mt-5 space-y-4" @submit.prevent="emit('submit')">
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="昵称" name="nickname" required>
            <UInput v-model="nicknameModel" class="w-full" placeholder="请输入昵称"/>
          </UFormField>
          <UFormField class="w-full" label="性别">
            <USelect
                v-model="genderModel"
                valueKey="value"
                :items="genderOptions"
                class="w-full"
            />
          </UFormField>
        </UFieldGroup>
        <UFieldGroup class="w-full gap-2">
          <UFormField class="w-full" label="手机号">
            <UInput v-model="mobileModel" class="w-full" placeholder="请输入手机号"/>
          </UFormField>
          <UFormField class="w-full" label="电子邮箱">
            <UInput v-model="emailModel" type="email" class="w-full" placeholder="请输入电子邮箱"/>
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="头像">
          <UFieldGroup class="w-full items-center gap-3">
            <UAvatar size="lg" :src="FileApi.resolveUrl(state.avatar)" icon="i-lucide-user"/>
            <UFileUpload
                v-model="avatarModel"
                :accept="AVATAR_UPLOAD_ACCEPT"
                label="上传头像拖到此处"
                :description="AVATAR_UPLOAD_DESCRIPTION"
                class="w-full min-h-24"
            />
          </UFieldGroup>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="modal-footer">
        <UButton
            label="取消"
            variant="ghost"
            color="neutral"
            :disabled="loading || submitting"
            @click="emit('update:open', false)"
        />
        <UButton
            label="重置"
            variant="ghost"
            color="neutral"
            :disabled="loading || submitting"
            @click="emit('reset')"
        />
        <UButton
            label="保存资料"
            icon="i-lucide-save"
            :loading="submitting"
            :disabled="loading || submitting"
            @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.modal-copy {
  padding-bottom: 6px;
}

.modal-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--library-text);
}

.modal-description {
  margin-top: 6px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.modal-footer {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}
</style>
