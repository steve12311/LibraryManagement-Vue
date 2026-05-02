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
import MeBorrowCard from "@/components/me/MeBorrowCard.vue";
import MeOverviewCard from "@/components/me/MeOverviewCard.vue";
import PasswordEditModal from "@/components/me/PasswordEditModal.vue";
import ProfileEditModal from "@/components/me/ProfileEditModal.vue";
import {useUserStore} from "@/store";
import { UserGenderTypeEnum } from "@/enums/system/status-enum.ts";
import { createGenderOptions } from "@/utils/option-items";
import {useMyBorrowOrders} from "@/composables/system/user/useMyBorrowOrders";

const PHONE_PATTERN = /^$|^1(3\d|4[5-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/;
const EMAIL_PATTERN = /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const router = useRouter();
const toast = useToast();
const userStore = useUserStore();

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
const genderOptions = ref(createGenderOptions());
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
const overviewDetails = computed(() => [
  {label: "用户 ID", value: String(profileInfo.value.id || "-")},
  {label: "登录账号", value: profileInfo.value.username || "-"},
  {label: "性别", value: getGenderLabel(profileInfo.value.gender)},
  {label: "手机号", value: profileInfo.value.mobile || "-"},
  {label: "电子邮箱", value: profileInfo.value.email || "-"},
  {label: "创建时间", value: createTimeText.value},
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

/**
 * 拉取个人资料。使用请求序号机制防止快速切换时的竞态条件：
 * 仅最近一次请求的结果会写入状态。
 */
async function fetchProfile() {
  const currentRequestSerial = ++profileRequestSerial.value;
  try {
    loadingProfile.value = true;
    const data = await UserAPI.getProfile();
    // 不是最新请求，丢弃结果
    if (currentRequestSerial !== profileRequestSerial.value) return;
    const normalizedProfile = normalizeProfile(data);
    profileInfo.value = normalizedProfile;
    applyProfileToForm(normalizedProfile);
    // 同步更新 store 中的展示信息
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

/**
 * 提交个人信息编辑。
 * 流程：表单校验 → 构建 payload → 头像文件检查+ base64 转换 → API 更新 → 刷新资料
 */
async function submitProfile() {
  if (submittingProfile.value || loadingProfile.value) return;

  // 表单校验
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
    // 构建提交 payload
    const payload: UserProfileForm = {
      id: profileForm.id ?? profileInfo.value.id,
      username: normalizeText(profileForm.username),
      nickname,
      avatar: normalizeText(profileForm.avatar),
      gender: normalizeGender(profileForm.gender),
      mobile,
      email,
    };
    // 头像文件 → base64
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

/**
 * 提交密码修改。
 * 流程：校验（完整性 / 一致性 / 新旧不同 / 长度）→ API 更新 → 关闭弹窗
 */
async function submitPassword() {
  if (submittingPassword.value) return;

  // 前端校验
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
    <div class="me-page-head">
      <div>
        <p class="me-page-kicker">PERSONAL SERVICE CENTER</p>
        <h1 class="me-page-title">个人中心</h1>
      </div>
      <div class="me-page-actions">
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

    <MeOverviewCard
        :loading="loadingProfile"
        :avatar="profileInfo.avatar"
        :display-name="displayName"
        :username="profileInfo.username"
        :role-items="roleItems"
        :stats="profileStats"
        :details="overviewDetails"
        :disable-profile-action="loadingProfile || submittingProfile"
        :disable-password-action="submittingPassword"
        @edit-profile="openProfileEditor"
        @edit-password="openPasswordEditor"
    />

    <MeBorrowCard
        :loading="loadingMyBorrowOrders"
        :orders="myBorrowOrders"
        :total="totalMyBorrowOrders"
        :page="myBorrowQueryParams.pageNum"
        :page-size="myBorrowQueryParams.pageSize"
        :status-filter="myBorrowStatusFilter"
        :status-items="myBorrowStatusItems"
        :get-borrow-status-label="getBorrowStatusLabel"
        :get-borrow-status-color="getBorrowStatusColor"
        :format-borrow-return-time="formatBorrowReturnTime"
        @update:status-filter="myBorrowStatusFilter = $event"
        @query="handleBorrowQuery"
        @reset="resetBorrowQuery"
        @refresh="fetchMyBorrowOrders"
        @page-change="
          (page) => {
            myBorrowQueryParams.pageNum = page;
            fetchMyBorrowOrders();
          }
        "
    />
  </div>
</template>
