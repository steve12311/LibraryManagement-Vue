<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import * as v from "valibot";
import {useRouter} from "vue-router";
import UserAPI, {
  type PasswordUpdateForm,
  type UserGender,
  type UserProfile,
  type UserProfileForm
} from "@/api/system/user-api.ts";
import {useUserStore} from "@/store";
import {UserGenderTypeEnum} from "@/enums/system/status-enum.ts";

const PHONE_PATTERN = /^$|^1(3\d|4[5-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/
const EMAIL_PATTERN = /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

const loadingProfile = ref(false)
const submittingProfile = ref(false)
const submittingPassword = ref(false)
const profileRequestSerial = ref(0)
const avatarModel = ref<File>()
const profileInfo = ref<UserProfile>(createProfile())
const profileForm = reactive<UserProfileForm>(createProfileForm())
const passwordState = reactive<PasswordUpdateForm>(createPasswordForm())

const profileSchema = v.object({
  nickname: v.pipe(v.string(), v.nonEmpty("昵称不能为空")),
  mobile: v.pipe(v.string(), v.regex(PHONE_PATTERN, "手机号格式不正确")),
  email: v.pipe(v.string(), v.regex(EMAIL_PATTERN, "电子邮箱格式不正确")),
})
const passwordSchema = v.object({
  oldPassword: v.pipe(v.string(), v.nonEmpty("请输入当前密码"), v.minLength(6, "当前密码不少于6位")),
  newPassword: v.pipe(v.string(), v.nonEmpty("请输入新密码"), v.minLength(6, "新密码不少于6位")),
  confirmPassword: v.pipe(v.string(), v.nonEmpty("请再次输入新密码"), v.minLength(6, "确认密码不少于6位")),
})
const genderOptions = ref<OptionType[]>([
  {
    label: "保密",
    value: UserGenderTypeEnum.UNKNOWN
  },
  {
    label: "男",
    value: UserGenderTypeEnum.MAN
  },
  {
    label: "女",
    value: UserGenderTypeEnum.WOMAN
  }
])
const roleItems = computed(() => normalizeRoleNames(profileInfo.value.roleNames))
const createTimeText = computed(() => formatDateTime(profileInfo.value.createTime))
const hasPasswordValue = computed(() => {
  return Boolean(passwordState.oldPassword || passwordState.newPassword || passwordState.confirmPassword)
})

onMounted(() => {
  void fetchProfile()
})

function createProfile(): UserProfile {
  return {
    id: 0,
    username: "",
    nickname: "",
    avatar: "",
    gender: UserGenderTypeEnum.UNKNOWN as UserGender,
    mobile: "",
    email: "",
    roleNames: "",
    createTime: ""
  }
}

function createProfileForm(): UserProfileForm {
  return {
    id: 0,
    username: "",
    nickname: "",
    avatar: "",
    gender: UserGenderTypeEnum.UNKNOWN as UserGender,
    mobile: "",
    email: "",
  }
}

function createPasswordForm(): PasswordUpdateForm {
  return {
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  }
}

function normalizeText(value?: string) {
  return String(value ?? "").trim()
}

function normalizeGender(value: unknown): UserGender {
  const gender = Number(value)
  if (gender === UserGenderTypeEnum.UNKNOWN || gender === UserGenderTypeEnum.MAN || gender === UserGenderTypeEnum.WOMAN) {
    return gender as UserGender
  }
  return UserGenderTypeEnum.UNKNOWN as UserGender
}

function normalizeProfile(raw?: Partial<UserProfile>): UserProfile {
  return {
    id: raw?.id ?? 0,
    username: normalizeText(raw?.username),
    nickname: normalizeText(raw?.nickname),
    avatar: normalizeText(raw?.avatar),
    gender: normalizeGender(raw?.gender),
    mobile: normalizeText(raw?.mobile),
    email: normalizeText(raw?.email),
    roleNames: normalizeText(raw?.roleNames),
    createTime: raw?.createTime ?? "",
  }
}

function toProfileForm(profile: UserProfile): UserProfileForm {
  return {
    id: profile.id,
    username: profile.username,
    nickname: profile.nickname,
    avatar: profile.avatar,
    gender: profile.gender,
    mobile: profile.mobile,
    email: profile.email,
  }
}

function applyProfileToForm(data: UserProfile) {
  Object.assign(profileForm, toProfileForm(data))
  avatarModel.value = void 0
}

function resetProfileForm() {
  if (loadingProfile.value || submittingProfile.value) return
  applyProfileToForm(profileInfo.value)
}

type AvatarFileItem = File | { file?: File; raw?: File }
type AvatarFileModel = AvatarFileItem | AvatarFileItem[]

function getAvatarFileFromModel(model?: AvatarFileModel): File | undefined {
  if (!model) return void 0
  if (model instanceof File) return model
  if (Array.isArray(model) && model.length > 0) {
    const first = model[0]
    if (first instanceof File) return first
    if (first.file instanceof File) return first.file
    if (first.raw instanceof File) return first.raw
    return void 0
  }
  if (model.file instanceof File) return model.file
  if (model.raw instanceof File) return model.raw
  return void 0
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function fetchProfile() {
  const currentRequestSerial = ++profileRequestSerial.value
  try {
    loadingProfile.value = true
    const data = await UserAPI.getProfile()
    if (currentRequestSerial !== profileRequestSerial.value) return
    const normalizedProfile = normalizeProfile(data)
    profileInfo.value = normalizedProfile
    applyProfileToForm(normalizedProfile)
    Object.assign(userStore.userInfo, {
      username: normalizedProfile.username,
      nickname: normalizedProfile.nickname,
      avatar: normalizedProfile.avatar
    })
  } catch (error) {
    if (currentRequestSerial !== profileRequestSerial.value) return
    console.error(error)
  } finally {
    if (currentRequestSerial === profileRequestSerial.value) {
      loadingProfile.value = false
    }
  }
}

async function submitProfile() {
  if (submittingProfile.value || loadingProfile.value) return
  const nickname = normalizeText(profileForm.nickname)
  const mobile = normalizeText(profileForm.mobile)
  const email = normalizeText(profileForm.email)
  if (!nickname) {
    toast.add({title: "错误", description: "昵称不能为空", color: "error"})
    return
  }
  if (!PHONE_PATTERN.test(mobile)) {
    toast.add({title: "错误", description: "手机号格式不正确", color: "error"})
    return
  }
  if (!EMAIL_PATTERN.test(email)) {
    toast.add({title: "错误", description: "电子邮箱格式不正确", color: "error"})
    return
  }

  try {
    submittingProfile.value = true
    const payload: UserProfileForm = {
      id: profileForm.id ?? profileInfo.value.id,
      username: normalizeText(profileForm.username),
      nickname,
      avatar: normalizeText(profileForm.avatar),
      gender: normalizeGender(profileForm.gender),
      mobile,
      email,
    }
    const file = getAvatarFileFromModel(avatarModel.value)
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.add({title: "错误", description: "头像文件必须为图片格式", color: "error"})
        return
      }
      if (file.size > MAX_AVATAR_SIZE) {
        toast.add({title: "错误", description: "头像文件不能超过2MB", color: "error"})
        return
      }
      payload.avatar = await fileToBase64(file)
    }
    await UserAPI.updateProfile(payload)
    toast.add({title: "成功", description: "个人信息已更新", color: "success"})
    await fetchProfile()
  } catch (error) {
    console.error(error)
  } finally {
    submittingProfile.value = false
  }
}

function resetPasswordState() {
  if (submittingPassword.value) return
  Object.assign(passwordState, createPasswordForm())
}

async function submitPassword() {
  if (submittingPassword.value) return
  const oldPassword = passwordState.oldPassword.trim()
  const newPassword = passwordState.newPassword.trim()
  const confirmPassword = passwordState.confirmPassword.trim()
  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.add({title: "错误", description: "请完整填写密码信息", color: "error"})
    return
  }
  if (newPassword !== confirmPassword) {
    toast.add({title: "错误", description: "两次输入的新密码不一致", color: "error"})
    return
  }
  if (oldPassword === newPassword) {
    toast.add({title: "错误", description: "新密码不能与当前密码一致", color: "error"})
    return
  }
  if (newPassword.length < 6) {
    toast.add({title: "错误", description: "新密码不少于6位", color: "error"})
    return
  }
  try {
    submittingPassword.value = true
    await UserAPI.editPassword({
      oldPassword,
      newPassword,
      confirmPassword,
    })
    toast.add({title: "成功", description: "密码修改成功", color: "success"})
    resetPasswordState()
  } catch (error) {
    console.error(error)
  } finally {
    submittingPassword.value = false
  }
}

function normalizeRoleNames(value?: string) {
  if (!value) return []
  return value
      .split(/[,，]/)
      .map(item => item.trim())
      .filter(Boolean)
}

function formatDateTime(value?: Date | string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleString("zh-CN")
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-4">
    <div class="profile-banner flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-default px-5 py-4">
      <div>
        <p class="text-xs font-semibold tracking-[0.22em] text-muted">PERSONAL CENTER</p>
        <h1 class="mt-1 text-2xl font-bold text-highlighted">个人主页</h1>
      </div>
      <div class="flex items-center gap-2">
        <UButton
            icon="i-lucide-refresh-cw"
            variant="soft"
            color="neutral"
            :loading="loadingProfile"
            @click="fetchProfile"
        >
          刷新信息
        </UButton>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" :disabled="submittingProfile || submittingPassword"
                 @click="router.back()">
          返回
        </UButton>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-5">
      <UCard class="profile-card lg:col-span-3">
        <template #header>
          <div class="flex items-center gap-4">
            <UAvatar :src="profileInfo.avatar" size="xl" icon="i-lucide-user"/>
            <div>
              <p class="text-xl font-semibold text-highlighted">{{ profileInfo.nickname || "未设置昵称" }}</p>
              <p class="text-sm text-muted">@{{ profileInfo.username || "未知账号" }}</p>
            </div>
          </div>
        </template>

        <div v-if="loadingProfile" class="space-y-3">
          <div
              v-for="item in 4"
              :key="item"
              class="h-10 animate-pulse rounded-lg bg-elevated"
          />
        </div>
        <div v-else class="space-y-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="info-item">
              <span class="label">用户ID</span>
              <span class="value">{{ profileInfo.id || "-" }}</span>
            </div>
            <div class="info-item">
              <span class="label">登录账号</span>
              <span class="value">{{ profileInfo.username || "-" }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ createTimeText }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色数量</span>
              <span class="value">{{ roleItems.length }}</span>
            </div>
          </div>

          <UForm :schema="profileSchema" :state="profileForm" class="space-y-4" @submit.prevent="submitProfile">
            <UFieldGroup class="w-full gap-2">
              <UFormField class="w-full" label="昵称" name="nickname" required>
                <UInput v-model="profileForm.nickname" class="w-full" placeholder="请输入昵称"/>
              </UFormField>
              <UFormField class="w-full" label="性别">
                <USelect
                    v-model="profileForm.gender"
                    valueKey="value"
                    :items="genderOptions"
                    class="w-full"
                />
              </UFormField>
            </UFieldGroup>
            <UFieldGroup class="w-full gap-2">
              <UFormField class="w-full" label="手机号">
                <UInput v-model="profileForm.mobile" class="w-full" placeholder="请输入手机号"/>
              </UFormField>
              <UFormField class="w-full" label="电子邮箱">
                <UInput v-model="profileForm.email" type="email" class="w-full" placeholder="请输入电子邮箱"/>
              </UFormField>
            </UFieldGroup>
            <UFormField class="w-full" label="头像">
              <UFieldGroup class="w-full items-center gap-3">
                <UAvatar size="lg" :src="profileForm.avatar" icon="i-lucide-user"/>
                <UFileUpload
                    v-model="avatarModel"
                    accept="image/*"
                    label="上传头像拖到此处"
                    description="图片会转为 Base64 存储"
                    class="w-full min-h-24"
                />
              </UFieldGroup>
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton type="button" variant="ghost" color="neutral" :disabled="loadingProfile || submittingProfile"
                       @click="resetProfileForm">
                重置
              </UButton>
              <UButton type="submit" :loading="submittingProfile" :disabled="loadingProfile || submittingProfile"
                       icon="i-lucide-save">
                保存资料
              </UButton>
            </div>
          </UForm>

          <div>
            <p class="mb-2 text-sm font-medium text-highlighted">角色</p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                  v-for="role in roleItems"
                  :key="role"
                  color="info"
                  variant="subtle"
              >
                {{ role }}
              </UBadge>
              <span v-if="roleItems.length === 0" class="role-empty text-sm text-muted">暂无角色</span>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="password-card lg:col-span-2">
        <template #header>
          <div>
            <p class="text-lg font-semibold text-highlighted">修改密码</p>
            <p class="mt-1 text-sm text-muted">修改后请使用新密码登录</p>
          </div>
        </template>

        <UForm :schema="passwordSchema" :state="passwordState" class="space-y-4" @submit.prevent="submitPassword">
          <UFormField label="当前密码" name="oldPassword" required>
            <UInput
                v-model="passwordState.oldPassword"
                type="password"
                class="w-full"
                placeholder="请输入当前密码"
            />
          </UFormField>
          <UFormField label="新密码" name="newPassword" required>
            <UInput
                v-model="passwordState.newPassword"
                type="password"
                class="w-full"
                placeholder="请输入新密码"
            />
          </UFormField>
          <UFormField label="确认新密码" name="confirmPassword" required>
            <UInput
                v-model="passwordState.confirmPassword"
                type="password"
                class="w-full"
                placeholder="请再次输入新密码"
            />
          </UFormField>
          <p class="text-xs text-muted">密码长度至少 6 位，建议包含字母和数字。</p>

          <div class="flex justify-end gap-2 pt-2">
            <UButton type="button" variant="ghost" color="neutral" :disabled="submittingPassword || !hasPasswordValue"
                     @click="resetPasswordState">
              清空
            </UButton>
            <UButton type="submit" :loading="submittingPassword" :disabled="submittingPassword" icon="i-lucide-key-round">
              更新密码
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.profile-banner {
  background: linear-gradient(145deg, rgb(255 255 255 / 100%) 0%, rgb(247 250 255 / 96%) 100%);
}

.profile-card,
.password-card {
  background: linear-gradient(145deg, rgb(255 255 255 / 96%) 0%, rgb(248 250 252 / 92%) 100%);
  border: 1px solid rgb(226 232 240 / 70%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgb(226 232 240 / 72%);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgb(248 250 252 / 72%);
}

.label {
  font-size: 12px;
  color: rgb(100 116 139);
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: rgb(15 23 42);
}

.role-empty {
  padding: 2px 10px;
  border: 1px dashed rgb(148 163 184 / 70%);
  border-radius: 9999px;
}
</style>
