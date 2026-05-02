<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue"
import * as v from "valibot"
import { useRoute, useRouter } from "vue-router"
import AuthAPI, { type LoginFormData } from "@/api/system/auth-api"
import { useUserStore } from "@/store"

const brandTitle = import.meta.env.VITE_APP_BRAND_TITLE || "校园图书馆"

onMounted(() => { startCaptchaAutoRefresh() })
onUnmounted(() => { stopCaptchaAutoRefresh() })

let captchaTimer: ReturnType<typeof setInterval> | undefined
const CAPTCHA_REFRESH_INTERVAL = 120 * 1000
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const captchaLoading = ref(false)
const loginLoading = ref(false)
const loginFormData = reactive<LoginFormData>({
  username: "",
  password: "",
  captchaKey: "",
  captchaCode: "",
})
const captchaBase64 = ref("")
const schema = v.object({
  username: v.pipe(v.string(), v.minLength(4, "账号最低4个字符")),
  password: v.pipe(v.string(), v.minLength(6, "密码最低6个字符")),
  captchaCode: v.pipe(v.string(), v.minLength(4, "请输入合法的验证码")),
})

function getRedirectPath() {
  const redirect = route.query.redirect
  if (typeof redirect !== "string" || redirect.trim() === "") return "/"

  const validateRedirectPath = (targetPath: string) => {
    if (!targetPath.startsWith("/")) return false
    if (targetPath.startsWith("//")) return false
    return !targetPath.includes("://")
  }

  try {
    const decodedPath = decodeURIComponent(redirect).trim()
    if (!decodedPath || decodedPath.length > 2048) return "/"
    return validateRedirectPath(decodedPath) ? decodedPath : "/"
  } catch {
    return "/"
  }
}

async function onSubmit() {
  if (loginLoading.value) return
  try {
    loginLoading.value = true
    await userStore.login(loginFormData)
    await router.push(getRedirectPath())
  } catch (err) {
    await refreshCaptcha()
    loginFormData.captchaCode = ""
    console.error("登录失败:", err)
  } finally {
    loginLoading.value = false
  }
}

function stopCaptchaAutoRefresh() {
  if (captchaTimer) { clearInterval(captchaTimer); captchaTimer = undefined }
}

function startCaptchaAutoRefresh() {
  stopCaptchaAutoRefresh()
  void refreshCaptcha()
  captchaTimer = setInterval(() => { void refreshCaptcha() }, CAPTCHA_REFRESH_INTERVAL)
}

async function refreshCaptcha() {
  if (captchaLoading.value) return
  captchaLoading.value = true
  try {
    const data = await AuthAPI.getCaptcha()
    loginFormData.captchaKey = data.captchaKey
    captchaBase64.value = data.captchaBase64
  } finally {
    captchaLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <p class="login-brand-kicker">CAMPUS LIBRARY SYSTEM</p>
        <h1 class="login-brand-title">{{ brandTitle }}</h1>
        <p class="login-brand-desc">馆藏检索、借阅服务与系统管理</p>
      </div>

      <div class="login-form-section">
        <h2 class="login-form-title">用户登录</h2>

        <UForm :schema="schema" :state="loginFormData" class="login-form-fields" @submit="onSubmit">
          <UFormField label="账号" name="username" required>
            <UInput v-model="loginFormData.username" class="w-full" size="xl" icon="i-lucide-user-round" placeholder="请输入账号"/>
          </UFormField>

          <UFormField label="密码" name="password" required>
            <UInput v-model="loginFormData.password" class="w-full" size="xl" type="password" icon="i-lucide-lock-keyhole" placeholder="请输入密码"/>
          </UFormField>

          <UFormField label="验证码" name="captchaCode" required>
            <div class="captcha-row">
              <UInput v-model="loginFormData.captchaCode" class="w-full" size="xl" icon="i-lucide-shield-check" placeholder="请输入验证码"/>
              <img class="captcha-image" :src="captchaBase64" :style="{ opacity: captchaLoading ? 0.5 : 1 }" alt="captchaCode" @click="refreshCaptcha"/>
            </div>
          </UFormField>

          <div class="login-submit-row">
            <p class="login-footnote">点击验证码图片可刷新</p>
            <UButton class="login-submit-btn" type="submit" size="xl" :loading="loginLoading" @click="onSubmit">登录系统</UButton>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--library-surface);
}

.login-card {
  width: 100%;
  max-width: 440px;
  border: 1px solid var(--library-border);
  border-radius: 16px;
  background: var(--library-card);
  overflow: hidden;
}

.login-brand {
  padding: 36px 36px 0;
}

.login-brand-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--library-accent);
  text-transform: uppercase;
}

.login-brand-title {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.18;
  font-family: var(--library-title-font);
}

.login-brand-desc {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--library-text-muted);
}

.login-form-section {
  padding: 28px 36px 36px;
}

.login-form-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.login-form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  border-radius: 10px;
  object-fit: contain;
  background: var(--library-card);
  flex-shrink: 0;
}

.login-submit-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.login-footnote {
  font-size: 12px;
  color: var(--library-text-muted);
  text-align: center;
}

.login-submit-btn {
  width: 100%;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--library-accent) 0%, var(--library-accent-strong) 100%);
}

@media (max-width: 640px) {
  .login-page {
    padding: 20px 16px;
    align-items: flex-start;
    padding-top: 64px;
  }

  .login-card {
    max-width: 100%;
  }

  .login-brand {
    padding: 28px 24px 0;
  }

  .login-form-section {
    padding: 22px 24px 28px;
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
