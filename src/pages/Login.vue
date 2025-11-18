<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref} from "vue";
import * as v from "valibot"
import {useRoute, useRouter} from "vue-router";
import AuthAPI, {type LoginFormData} from "../api/auth-api";
import {useUserStore} from "../store";

onMounted(() => {
  getCaptcha()
})
onUnmounted(() => {
  clearInterval(intervalId)
})

let intervalId: undefined | NodeJS.Timeout;
const userStore = useUserStore();
const router = useRouter()
const route = useRoute();
const codeLoading = ref(false);
const loginFormData = reactive<LoginFormData>({
  username: "",
  password: "",
  captchaKey: "",
  captchaCode: "",
})
const captchaBase64 = ref("")
const schema = v.object({
  username: v.pipe(v.string(), v.minLength(5, "账号最低5个字符")),
  password: v.pipe(v.string(), v.minLength(8, "密码最低8个字符")),
  captchaCode: v.pipe(v.string(), v.minLength(4, "请输入合法的验证码")),
})

async function onSubmit() {
  try {
    await userStore.login(loginFormData)
    const redirectPath = (route.query.redirect as string) || "/";
    await router.push(decodeURIComponent(redirectPath));
  } catch (err) {
    getCaptcha();
    console.error("登录失败:", err);
  }
}

function getCaptcha() {
  clearInterval(intervalId)
  _getCaptcha()
  setInterval(() => {
    _getCaptcha()
  }, 120 * 1000)

  function _getCaptcha() {
    codeLoading.value = true;
    AuthAPI.getCaptcha()
        .then((data) => {
          loginFormData.captchaKey = data.captchaKey;
          captchaBase64.value = data.captchaBase64;
        })
        .finally(() => (codeLoading.value = false));
  }
}
</script>

<template>
  <div class="login_container w-full h-screen flex justify-center items-center">
    <UForm class="w-1/3" :schema="schema" :state="loginFormData" @submit="onSubmit">
      <UCard>
        <template #header>
          <div class="font-bold text-2xl text-center">用户登录</div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField label="账号" name="username" required>
            <UInput class="w-full" v-model="loginFormData.username"/>
          </UFormField>
          <UFormField label="密码" name="password" required>
            <UInput class="w-full" type="password" v-model="loginFormData.password"/>
          </UFormField>
          <UFormField label="验证码" name="captchaCode" required>
            <div class="flex gap-4 justify-between">
              <UInput class="w-full" v-model="loginFormData.captchaCode"/>
              <img @click="getCaptcha" :src="captchaBase64" alt="captchaCode"/>
            </div>
          </UFormField>
        </div>
        <template #footer>
          <UButton class="w-full" type="submit">
            <div class="w-full text-center">登录</div>
          </UButton>
        </template>
      </UCard>
    </UForm>
  </div>
</template>

<style scoped>

</style>