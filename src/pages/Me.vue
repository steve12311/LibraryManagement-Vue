<script setup lang="ts">
import {computed, h, onMounted, reactive, ref, resolveComponent} from "vue";
import type {TableColumn} from "@nuxt/ui";
import * as v from "valibot";
import {useRouter} from "vue-router";
import UserAPI, {
  type MyBorrowPageVO,
  type PasswordUpdateForm,
  type UserGender,
  type UserProfile,
  type UserProfileForm
} from "@/api/system/user-api.ts";
import PasswordEditModal from "@/components/me/PasswordEditModal.vue";
import ProfileEditModal from "@/components/me/ProfileEditModal.vue";
import {useUserStore} from "@/store";
import {UserGenderTypeEnum} from "@/enums/system/status-enum.ts";
import {useMyBorrowOrders} from "@/composables/system/user/useMyBorrowOrders";

const PHONE_PATTERN = /^$|^1(3\d|4[5-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/;
const EMAIL_PATTERN = /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const router = useRouter();
const toast = useToast();
const userStore = useUserStore();
const UBadge = resolveComponent("UBadge");

const loadingProfile = ref(false);
const submittingProfile = ref(false);
const submittingPassword = ref(false);
const openProfileEditModal = ref(false);
const openPasswordEditModal = ref(false);
const profileRequestSerial = ref(0);
const avatarModel = ref<File>();
const profileInfo = ref<UserProfile>(createProfile());
const profileForm = reactive<UserProfileForm>(createProfileForm());
const passwordState = reactive<PasswordUpdateForm>(createPasswordForm());

const profileSchema = v.object({
  nickname: v.pipe(v.string(), v.nonEmpty("昵称不能为空")),
  mobile: v.pipe(v.string(), v.regex(PHONE_PATTERN, "手机号格式不正确")),
  email: v.pipe(v.string(), v.regex(EMAIL_PATTERN, "电子邮箱格式不正确")),
});
const passwordSchema = v.object({
  oldPassword: v.pipe(v.string(), v.nonEmpty("请输入当前密码"), v.minLength(6, "当前密码不少于6位")),
  newPassword: v.pipe(v.string(), v.nonEmpty("请输入新密码"), v.minLength(6, "新密码不少于6位")),
  confirmPassword: v.pipe(v.string(), v.nonEmpty("请再次输入新密码"), v.minLength(6, "确认密码不少于6位")),
});
const genderOptions = ref<OptionType[]>([
  {label: "保密", value: UserGenderTypeEnum.UNKNOWN},
  {label: "男", value: UserGenderTypeEnum.MAN},
  {label: "女", value: UserGenderTypeEnum.WOMAN}
]);
const roleItems = computed(() => normalizeRoleNames(profileInfo.value.roleNames));
const createTimeText = computed(() => formatDateTime(profileInfo.value.createTime));
const displayName = computed(() => profileInfo.value.nickname || profileInfo.value.username || "未设置昵称");
const boundContactCount = computed(() => {
  return [profileInfo.value.mobile, profileInfo.value.email].filter(Boolean).length;
});
const profileStats = computed(() => [
  {label: "借阅记录", value: `${totalMyBorrowOrders.value}`},
  {label: "角色数量", value: `${roleItems.value.length}`},
  {label: "已绑定信息", value: `${boundContactCount.value}/2`}
]);
const hasPasswordValue = computed(() => {
  return Boolean(passwordState.oldPassword || passwordState.newPassword || passwordState.confirmPassword);
});
const {
  myBorrowOrders,
  totalMyBorrowOrders,
  loadingMyBorrowOrders,
  myBorrowQueryParams,
  myBorrowStatusFilter,
  myBorrowStatusItems,
  fetchMyBorrowOrders,
  handleBorrowQuery,
  resetBorrowQuery,
  getBorrowStatusLabel,
  getBorrowStatusColor,
  formatBorrowReturnTime,
} = useMyBorrowOrders();
const borrowColumns = ref<TableColumn<MyBorrowPageVO>[]>([
  {
    id: "book",
    header: "图书信息",
    cell: ({row}) => {
      const cover = row.original.cover;
      return h("div", {class: "flex min-w-0 items-center gap-3"}, [
        cover
          ? h("img", {
            src: cover,
            alt: row.original.bookName,
            class: "h-14 w-10 rounded-xl border border-default bg-elevated object-cover"
          })
          : h("div", {
            class: "flex h-14 w-10 items-center justify-center rounded-xl border border-default bg-elevated text-[10px] text-muted"
          }, "暂无封面"),
        h("div", {class: "min-w-0 space-y-1"}, [
          h("p", {class: "truncate font-medium text-highlighted"}, row.original.bookName || "-"),
          h("p", {class: "text-xs text-muted"}, `ISBN ${row.original.isbn || "-"}`)
        ])
      ]);
    }
  },
  {
    accessorKey: "borrowId",
    header: "借阅单号",
  },
  {
    accessorKey: "returnTime",
    header: "应还时间",
    cell: ({row}) => formatBorrowReturnTime(row.original.returnTime),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({row}) => {
      return h(UBadge, {
        color: getBorrowStatusColor(row.original.status),
        variant: "subtle",
        class: "capitalize",
      }, () => getBorrowStatusLabel(row.original.status));
    }
  }
]);

onMounted(() => {
  void refreshPage();
});

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
  };
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
  };
}

function createPasswordForm(): PasswordUpdateForm {
  return {
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  };
}

function normalizeText(value?: string) {
  return String(value ?? "").trim();
}

function normalizeGender(value: unknown): UserGender {
  const gender = Number(value);
  if (gender === UserGenderTypeEnum.UNKNOWN || gender === UserGenderTypeEnum.MAN || gender === UserGenderTypeEnum.WOMAN) {
    return gender as UserGender;
  }
  return UserGenderTypeEnum.UNKNOWN as UserGender;
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
  };
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
  };
}

function applyProfileToForm(data: UserProfile) {
  Object.assign(profileForm, toProfileForm(data));
  avatarModel.value = void 0;
}

function resetProfileForm() {
  if (loadingProfile.value || submittingProfile.value) return;
  applyProfileToForm(profileInfo.value);
}

function handleProfileEditModalChange(open: boolean) {
  openProfileEditModal.value = open;
  if (open) {
    applyProfileToForm(profileInfo.value);
    return;
  }
  resetProfileForm();
}

function openProfileEditor() {
  if (loadingProfile.value || submittingProfile.value) return;
  applyProfileToForm(profileInfo.value);
  openProfileEditModal.value = true;
}

function handlePasswordEditModalChange(open: boolean) {
  openPasswordEditModal.value = open;
  if (!open) {
    resetPasswordState();
  }
}

function openPasswordEditor() {
  if (submittingPassword.value) return;
  resetPasswordState();
  openPasswordEditModal.value = true;
}

function getAvatarFileFromModel(model?: File): File | undefined {
  if (!model) return void 0;
  if (model instanceof File) return model;
  return void 0;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fetchProfile() {
  const currentRequestSerial = ++profileRequestSerial.value;
  try {
    loadingProfile.value = true;
    const data = await UserAPI.getProfile();
    if (currentRequestSerial !== profileRequestSerial.value) return;
    const normalizedProfile = normalizeProfile(data);
    profileInfo.value = normalizedProfile;
    applyProfileToForm(normalizedProfile);
    Object.assign(userStore.userInfo, {
      username: normalizedProfile.username,
      nickname: normalizedProfile.nickname,
      avatar: normalizedProfile.avatar
    });
  } catch (error) {
    if (currentRequestSerial !== profileRequestSerial.value) return;
    console.error(error);
  } finally {
    if (currentRequestSerial === profileRequestSerial.value) {
      loadingProfile.value = false;
    }
  }
}

async function refreshPage() {
  await Promise.all([
    fetchProfile(),
    fetchMyBorrowOrders(),
  ]);
}

async function submitProfile() {
  if (submittingProfile.value || loadingProfile.value) return;
  const nickname = normalizeText(profileForm.nickname);
  const mobile = normalizeText(profileForm.mobile);
  const email = normalizeText(profileForm.email);
  if (!nickname) {
    toast.add({title: "错误", description: "昵称不能为空", color: "error"});
    return;
  }
  if (!PHONE_PATTERN.test(mobile)) {
    toast.add({title: "错误", description: "手机号格式不正确", color: "error"});
    return;
  }
  if (!EMAIL_PATTERN.test(email)) {
    toast.add({title: "错误", description: "电子邮箱格式不正确", color: "error"});
    return;
  }

  try {
    submittingProfile.value = true;
    const payload: UserProfileForm = {
      id: profileForm.id ?? profileInfo.value.id,
      username: normalizeText(profileForm.username),
      nickname,
      avatar: normalizeText(profileForm.avatar),
      gender: normalizeGender(profileForm.gender),
      mobile,
      email,
    };
    const file = getAvatarFileFromModel(avatarModel.value);
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.add({title: "错误", description: "头像文件必须为图片格式", color: "error"});
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        toast.add({title: "错误", description: "头像文件不能超过2MB", color: "error"});
        return;
      }
      payload.avatar = await fileToBase64(file);
    }
    await UserAPI.updateProfile(payload);
    toast.add({title: "成功", description: "个人信息已更新", color: "success"});
    await fetchProfile();
    openProfileEditModal.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    submittingProfile.value = false;
  }
}

function resetPasswordState() {
  if (submittingPassword.value) return;
  Object.assign(passwordState, createPasswordForm());
}

async function submitPassword() {
  if (submittingPassword.value) return;
  const oldPassword = passwordState.oldPassword.trim();
  const newPassword = passwordState.newPassword.trim();
  const confirmPassword = passwordState.confirmPassword.trim();
  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.add({title: "错误", description: "请完整填写密码信息", color: "error"});
    return;
  }
  if (newPassword !== confirmPassword) {
    toast.add({title: "错误", description: "两次输入的新密码不一致", color: "error"});
    return;
  }
  if (oldPassword === newPassword) {
    toast.add({title: "错误", description: "新密码不能与当前密码一致", color: "error"});
    return;
  }
  if (newPassword.length < 6) {
    toast.add({title: "错误", description: "新密码不少于6位", color: "error"});
    return;
  }
  try {
    submittingPassword.value = true;
    await UserAPI.editPassword({
      oldPassword,
      newPassword,
      confirmPassword,
    });
    toast.add({title: "成功", description: "密码修改成功", color: "success"});
    openPasswordEditModal.value = false;
    resetPasswordState();
  } catch (error) {
    console.error(error);
  } finally {
    submittingPassword.value = false;
  }
}

function normalizeRoleNames(value?: string) {
  if (!value) return [];
  return value
      .split(/[,，]/)
      .map(item => item.trim())
      .filter(Boolean);
}

function formatDateTime(value?: Date | string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("zh-CN");
}

function getGenderLabel(gender?: UserGender) {
  if (gender === UserGenderTypeEnum.UNKNOWN) return "保密";
  if (gender === UserGenderTypeEnum.MAN) return "男";
  if (gender === UserGenderTypeEnum.WOMAN) return "女";
  return "-";
}
</script>

<template>
  <ProfileEditModal
      :open="openProfileEditModal"
      :state="profileForm"
      :schema="profileSchema"
      :gender-options="genderOptions"
      :loading="loadingProfile"
      :submitting="submittingProfile"
      :avatar-model="avatarModel"
      @update:open="handleProfileEditModalChange"
      @update:state="Object.assign(profileForm, $event)"
      @update:avatar-model="avatarModel = $event"
      @reset="resetProfileForm"
      @submit="submitProfile"
  />
  <PasswordEditModal
      :open="openPasswordEditModal"
      :state="passwordState"
      :schema="passwordSchema"
      :submitting="submittingPassword"
      :has-password-value="hasPasswordValue"
      @update:open="handlePasswordEditModalChange"
      @update:state="Object.assign(passwordState, $event)"
      @reset="resetPasswordState"
      @submit="submitPassword"
  />

  <div class="me-shell">
    <div class="page-head">
      <div>
        <p class="page-kicker">PERSONAL SERVICE CENTER</p>
        <h1 class="page-title">个人中心</h1>
      </div>
      <div class="page-actions">
        <UButton
            icon="i-lucide-refresh-cw"
            variant="soft"
            color="neutral"
            :loading="loadingProfile || loadingMyBorrowOrders"
            @click="refreshPage"
        >
          刷新信息
        </UButton>
        <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :disabled="submittingProfile || submittingPassword"
            @click="router.back()"
        >
          返回
        </UButton>
      </div>
    </div>

    <UCard class="overview-card" :ui="{ body: 'p-0' }">
      <div class="overview-hero">
        <div class="identity-block">
          <UAvatar :src="profileInfo.avatar" size="xl" icon="i-lucide-user" />
          <div class="identity-copy">
            <p class="identity-name">{{ displayName }}</p>
            <p class="identity-account">@{{ profileInfo.username || "未知账号" }}</p>
            <div class="identity-role-list">
              <UBadge
                  v-for="role in roleItems"
                  :key="role"
                  color="info"
                  variant="soft"
              >
                {{ role }}
              </UBadge>
              <span v-if="roleItems.length === 0" class="role-empty">暂无角色</span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <UButton
              icon="i-lucide-pencil-line"
              variant="soft"
              :disabled="loadingProfile || submittingProfile"
              @click="openProfileEditor"
          >
            编辑资料
          </UButton>
          <UButton
              icon="i-lucide-key-round"
              color="neutral"
              variant="ghost"
              :disabled="submittingPassword"
              @click="openPasswordEditor"
          >
            修改密码
          </UButton>
        </div>
      </div>

      <div v-if="loadingProfile" class="overview-loading">
        <div v-for="item in 6" :key="item" class="loading-block" />
      </div>

      <div v-else class="overview-body">
        <div class="stats-grid">
          <div v-for="item in profileStats" :key="item.label" class="stat-item">
            <p class="stat-label">{{ item.label }}</p>
            <p class="stat-value">{{ item.value }}</p>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">用户 ID</span>
            <span class="detail-value">{{ profileInfo.id || "-" }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">登录账号</span>
            <span class="detail-value">{{ profileInfo.username || "-" }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">性别</span>
            <span class="detail-value">{{ getGenderLabel(profileInfo.gender) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">手机号</span>
            <span class="detail-value">{{ profileInfo.mobile || "-" }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">电子邮箱</span>
            <span class="detail-value">{{ profileInfo.email || "-" }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ createTimeText }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <UCard class="borrow-card">
      <template #header>
        <div class="borrow-header">
          <div>
            <p class="borrow-title">我的借阅订单</p>
            <p class="borrow-subtitle">当前登录账号的借阅记录与状态</p>
          </div>
          <div class="borrow-actions">
            <USelect
                v-model="myBorrowStatusFilter"
                :items="myBorrowStatusItems"
                class="w-32"
            />
            <UButton icon="i-lucide-filter" variant="soft" :loading="loadingMyBorrowOrders" @click="handleBorrowQuery">
              筛选
            </UButton>
            <UButton variant="ghost" color="neutral" :disabled="loadingMyBorrowOrders" @click="resetBorrowQuery">
              重置
            </UButton>
            <UButton
                icon="i-lucide-refresh-cw"
                variant="ghost"
                color="neutral"
                :loading="loadingMyBorrowOrders"
                @click="fetchMyBorrowOrders"
            >
              刷新列表
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="loadingMyBorrowOrders" class="borrow-loading">
        <div v-for="item in 4" :key="item" class="loading-block h-16" />
      </div>
      <div v-else-if="myBorrowOrders.length === 0" class="borrow-empty">
        <p class="text-base font-medium text-highlighted">暂无借阅订单</p>
        <p class="mt-1 text-sm text-muted">当前筛选条件下没有查到借阅记录。</p>
      </div>
      <UTable
          v-else
          class="h-full"
          :data="myBorrowOrders"
          :columns="borrowColumns"
          :loading="loadingMyBorrowOrders"
          loading-color="primary"
          loading-animation="carousel"
      />

      <template #footer>
        <div class="borrow-footer">
          <p class="text-xs text-muted">共 {{ totalMyBorrowOrders }} 条借阅记录</p>
          <UPagination
              v-if="totalMyBorrowOrders > myBorrowQueryParams.pageSize"
              v-model:page="myBorrowQueryParams.pageNum"
              :total="totalMyBorrowOrders"
              :items-per-page="myBorrowQueryParams.pageSize"
              @update:page="fetchMyBorrowOrders"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.me-shell {
  display: flex;
  max-width: 1160px;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--library-accent);
}

.page-title {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 800;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-card,
.borrow-card {
  border: 0;
  border-radius: 28px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.overview-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 28px;
  background:
      linear-gradient(145deg, rgb(245 249 252 / 96%) 0%, rgb(255 255 255 / 100%) 100%);
}

.identity-block {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
}

.identity-copy {
  min-width: 0;
}

.identity-name {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--library-text);
}

.identity-account {
  margin-top: 4px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.identity-role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.role-empty {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border: 1px dashed var(--library-border-strong);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--library-text-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-loading,
.borrow-loading {
  display: grid;
  gap: 12px;
  padding: 24px 28px 28px;
}

.loading-block {
  height: 78px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgb(240 244 248 / 90%) 0%, rgb(248 250 252 / 96%) 100%);
  animation: pulse 1.4s ease-in-out infinite;
}

.overview-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0 28px 28px;
}

.stats-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-item {
  border-radius: 20px;
  padding: 18px 20px;
  background: var(--library-card-muted);
}

.stat-label {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--library-text-muted);
  text-transform: uppercase;
}

.stat-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 800;
  color: var(--library-text);
}

.detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 18px;
  padding: 16px 18px;
  background: rgb(248 250 252 / 82%);
}

.detail-label {
  font-size: 12px;
  color: var(--library-text-muted);
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--library-text);
  word-break: break-all;
}

.borrow-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.borrow-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--library-text);
}

.borrow-subtitle {
  margin-top: 6px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.borrow-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.borrow-empty {
  border: 1px dashed rgb(203 213 225 / 90%);
  border-radius: 20px;
  padding: 2.5rem 1rem;
  text-align: center;
  background: rgb(248 250 252 / 75%);
}

.borrow-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@media (max-width: 1024px) {
  .stats-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-hero,
  .overview-loading,
  .overview-body {
    padding-inline: 20px;
  }

  .stats-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .identity-name {
    font-size: 24px;
  }
}
</style>
