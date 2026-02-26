<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref} from "vue";
import * as v from "valibot"
import {useRoute, useRouter} from "vue-router";
import AuthAPI, {type LoginFormData} from "@/api/system/auth-api";
import {useUserStore} from "@/store";

onMounted(() => {
  startCaptchaAutoRefresh()
})
onUnmounted(() => {
  stopCaptchaAutoRefresh()
})

let captchaTimer: ReturnType<typeof setInterval> | undefined;
const CAPTCHA_REFRESH_INTERVAL = 120 * 1000;
const userStore = useUserStore();
const router = useRouter()
const route = useRoute();
const captchaLoading = ref(false);
const loginLoading = ref(false);
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
  const redirect = route.query.redirect;
  if (typeof redirect !== "string" || redirect.trim() === "") {
    return "/";
  }

  try {
    return decodeURIComponent(redirect);
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
    await userStore.login(loginFormData)
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
  refreshCaptcha();
  captchaTimer = setInterval(() => {
    refreshCaptcha();
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
  <div class="login_container w-full h-screen flex justify-center items-center">
    <UForm class="w-full max-w-md px-4" :schema="schema" :state="loginFormData" @submit="onSubmit">
      <UCard>
        <template #header>
          <div class="font-bold text-2xl text-center">用户登录</div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField label="账号" name="username" required>
            <UInput class="w-full" v-model="loginFormData.username" placeholder="请输入账号"/>
          </UFormField>
          <UFormField label="密码" name="password" required>
            <UInput class="w-full" type="password" v-model="loginFormData.password" placeholder="请输入密码"/>
          </UFormField>
          <UFormField label="验证码" name="captchaCode" required>
            <div class="flex gap-4 justify-between">
              <UInput class="w-full" v-model="loginFormData.captchaCode" placeholder="请输入验证码"/>
              <img
                  class="captcha-image"
                  @click="refreshCaptcha"
                  :src="captchaBase64"
                  :style="{opacity: captchaLoading ? 0.5 : 1}"
                  alt="captchaCode"
              />
            </div>
          </UFormField>
        </div>
        <template #footer>
          <UButton class="w-full" type="submit" :loading="loginLoading">
            <div class="w-full text-center">登录</div>
          </UButton>
        </template>
      </UCard>
    </UForm>
  </div>
</template>

<style scoped>
.captcha-image {
  height: 32px;
  min-width: 96px;
  cursor: pointer;
  border-radius: 6px;
  object-fit: cover;
}
</style>
