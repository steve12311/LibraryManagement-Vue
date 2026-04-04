<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref} from "vue";
import * as v from "valibot";
import {useRoute, useRouter} from "vue-router";
import AuthAPI, {type LoginFormData} from "@/api/system/auth-api";
import {useUserStore} from "@/store";

const brandHighlights = [
  "统一管理馆藏、借阅与系统账号",
  "支持公开检索、后台运营与数据分析",
  "延续校园图书馆系统的克制与学院气质"
];

const entrySteps = [
  {
    label: "账号登录",
    text: "使用个人账号进入系统工作台"
  },
  {
    label: "校验验证码",
    text: "通过动态验证码保护登录入口"
  },
  {
    label: "进入工作区",
    text: "在统一界面处理图书与借阅业务"
  }
];

onMounted(() => {
  startCaptchaAutoRefresh();
});

onUnmounted(() => {
  stopCaptchaAutoRefresh();
});

let captchaTimer: ReturnType<typeof setInterval> | undefined;
const CAPTCHA_REFRESH_INTERVAL = 120 * 1000;
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const captchaLoading = ref(false);
const loginLoading = ref(false);
const loginFormData = reactive<LoginFormData>({
  username: "",
  password: "",
  captchaKey: "",
  captchaCode: "",
});
const captchaBase64 = ref("");
const schema = v.object({
  username: v.pipe(v.string(), v.minLength(4, "账号最低4个字符")),
  password: v.pipe(v.string(), v.minLength(6, "密码最低6个字符")),
  captchaCode: v.pipe(v.string(), v.minLength(4, "请输入合法的验证码")),
});

function getRedirectPath() {
  const redirect = route.query.redirect;
  if (typeof redirect !== "string" || redirect.trim() === "") {
    return "/";
  }

  const validateRedirectPath = (targetPath: string) => {
    if (!targetPath.startsWith("/")) return false;
    if (targetPath.startsWith("//")) return false;
    if (targetPath.includes("://")) return false;
    return true;
  };

  try {
    const decodedPath = decodeURIComponent(redirect).trim();
    if (!decodedPath || decodedPath.length > 2048) {
      return "/";
    }
    return validateRedirectPath(decodedPath) ? decodedPath : "/";
  } catch {
    return "/";
  }
}

async function onSubmit() {
  if (loginLoading.value) {
    return;
  }

  try {
    loginLoading.value = true;
    await userStore.login(loginFormData);
    await router.push(getRedirectPath());
  } catch (err) {
    await refreshCaptcha();
    loginFormData.captchaCode = "";
    console.error("登录失败:", err);
  } finally {
    loginLoading.value = false;
  }
}

function stopCaptchaAutoRefresh() {
  if (captchaTimer) {
    clearInterval(captchaTimer);
    captchaTimer = undefined;
  }
}

function startCaptchaAutoRefresh() {
  stopCaptchaAutoRefresh();
  void refreshCaptcha();
  captchaTimer = setInterval(() => {
    void refreshCaptcha();
  }, CAPTCHA_REFRESH_INTERVAL);
}

async function refreshCaptcha() {
  if (captchaLoading.value) {
    return;
  }

  captchaLoading.value = true;
  try {
    const data = await AuthAPI.getCaptcha();
    loginFormData.captchaKey = data.captchaKey;
    captchaBase64.value = data.captchaBase64;
  } finally {
    captchaLoading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-glow login-glow-primary" />
    <div class="login-glow login-glow-secondary" />

    <div class="login-layout">
      <section class="brand-panel">
        <div class="brand-shell">
          <div class="brand-copy">
            <p class="brand-kicker">CAMPUS LIBRARY SYSTEM</p>
            <h1 class="brand-title">校园图书馆知识归档与运营平台</h1>
            <p class="brand-description">
              面向馆员与系统管理员的统一工作台，集中处理馆藏流转、借阅服务、
              用户管理与后台运营。
            </p>
          </div>

          <div class="brand-highlight-list">
            <div
                v-for="item in brandHighlights"
                :key="item"
                class="brand-highlight"
            >
              <UIcon name="i-lucide-check-circle-2" class="brand-highlight-icon" />
              <span>{{ item }}</span>
            </div>
          </div>

          <div class="brand-step-grid">
            <div v-for="item in entrySteps" :key="item.label" class="brand-step">
              <p class="brand-step-label">{{ item.label }}</p>
              <p class="brand-step-text">{{ item.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <UCard
            class="auth-card"
            :ui="{
              root: 'rounded-[28px] border-0',
              body: 'p-7 sm:p-8',
              header: 'px-7 pt-7 sm:px-8 sm:pt-8',
              footer: 'px-7 pb-7 sm:px-8 sm:pb-8'
            }"
        >
          <template #header>
            <div class="auth-header">
              <p class="auth-kicker">欢迎回来</p>
              <h2 class="auth-title">用户登录</h2>
              <p class="auth-description">输入账号、密码与验证码后进入系统工作区。</p>
            </div>
          </template>

          <UForm :schema="schema" :state="loginFormData" class="space-y-4" @submit="onSubmit">
            <UFormField label="账号" name="username" required>
              <UInput
                  v-model="loginFormData.username"
                  class="w-full"
                  size="xl"
                  icon="i-lucide-user-round"
                  placeholder="请输入账号"
              />
            </UFormField>

            <UFormField label="密码" name="password" required>
              <UInput
                  v-model="loginFormData.password"
                  class="w-full"
                  size="xl"
                  type="password"
                  icon="i-lucide-lock-keyhole"
                  placeholder="请输入密码"
              />
            </UFormField>

            <UFormField label="验证码" name="captchaCode" required>
              <div class="captcha-row">
                <UInput
                    v-model="loginFormData.captchaCode"
                    class="w-full"
                    size="xl"
                    icon="i-lucide-shield-check"
                    placeholder="请输入验证码"
                />
                <img
                    class="captcha-image"
                    :src="captchaBase64"
                    :style="{ opacity: captchaLoading ? 0.5 : 1 }"
                    alt="captchaCode"
                    @click="refreshCaptcha"
                />
              </div>
            </UFormField>
          </UForm>

          <template #footer>
            <div class="auth-footer">
              <p class="auth-footnote">验证码每 120 秒自动刷新一次，也可点击图片立即刷新。</p>
              <UButton
                  class="auth-submit"
                  type="submit"
                  size="xl"
                  :loading="loginLoading"
                  @click="onSubmit"
              >
                登录系统
              </UButton>
            </div>
          </template>
        </UCard>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 32px 20px;
  background:
      radial-gradient(circle at top left, rgb(0 99 152 / 10%), transparent 34%),
      linear-gradient(180deg, #f7f9fb 0%, #f1f5f8 100%);
}

.login-glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(42px);
  opacity: 0.9;
  pointer-events: none;
}

.login-glow-primary {
  top: -120px;
  left: -60px;
  width: 320px;
  height: 320px;
  background: rgb(0 99 152 / 12%);
}

.login-glow-secondary {
  right: -120px;
  bottom: -140px;
  width: 360px;
  height: 360px;
  background: rgb(32 43 61 / 10%);
}

.login-layout {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1160px, 100%);
  grid-template-columns: minmax(0, 1.15fr) minmax(420px, 0.85fr);
  gap: 24px;
  align-items: stretch;
}

.brand-panel,
.auth-panel {
  min-width: 0;
}

.brand-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 32px;
  padding: 40px;
  background:
      linear-gradient(160deg, rgb(255 255 255 / 88%) 0%, rgb(241 247 251 / 94%) 100%);
  box-shadow: var(--library-shadow);
  backdrop-filter: blur(10px);
}

.brand-kicker,
.auth-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--library-accent);
}

.brand-title {
  margin-top: 18px;
  font-size: clamp(34px, 4vw, 52px);
  font-weight: 800;
  line-height: 1.08;
}

.brand-description {
  max-width: 32rem;
  margin-top: 18px;
  font-size: 16px;
  line-height: 1.75;
  color: var(--library-text-muted);
}

.brand-highlight-list {
  display: grid;
  gap: 12px;
  margin-top: 28px;
}

.brand-highlight {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--library-text);
}

.brand-highlight-icon {
  width: 18px;
  height: 18px;
  color: var(--library-accent);
}

.brand-step-grid {
  display: grid;
  gap: 14px;
  margin-top: 40px;
}

.brand-step {
  border-radius: 22px;
  padding: 18px 20px;
  background: rgb(255 255 255 / 74%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 60%);
}

.brand-step-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--library-text);
}

.brand-step-text {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--library-text-muted);
}

.auth-card {
  height: 100%;
  background:
      linear-gradient(180deg, rgb(0 99 152 / 4%) 0%, rgb(255 255 255 / 96%) 14%, #fff 100%);
  box-shadow: var(--library-shadow);
}

.auth-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-title {
  font-size: 30px;
  font-weight: 800;
}

.auth-description,
.auth-footnote {
  font-size: 14px;
  line-height: 1.7;
  color: var(--library-text-muted);
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-image {
  width: 116px;
  height: 44px;
  padding: 4px 6px;
  box-sizing: border-box;
  cursor: pointer;
  border: 1px solid var(--library-border);
  border-radius: 16px;
  object-fit: contain;
  background: #fff;
}

.auth-footer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-submit {
  width: 100%;
  justify-content: center;
  border-radius: 16px;
  background:
      linear-gradient(135deg, var(--library-accent) 0%, var(--library-accent-strong) 100%);
  box-shadow: 0 16px 32px rgb(0 99 152 / 18%);
}

@media (max-width: 1024px) {
  .login-layout {
    grid-template-columns: 1fr;
  }

  .brand-shell,
  .auth-card {
    border-radius: 28px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .brand-shell,
  .auth-card {
    border-radius: 24px;
  }

  .brand-shell {
    padding: 28px 22px;
  }

  .captcha-row {
    flex-direction: column;
    align-items: stretch;
  }

  .captcha-image {
    width: 100%;
    height: 48px;
  }
}
</style>
