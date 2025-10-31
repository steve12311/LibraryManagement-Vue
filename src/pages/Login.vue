<script setup lang="ts">
import {onMounted, onUnmounted, reactive, ref} from "vue";
import {get, post} from "../api/request"
import * as v from "valibot"
import {useRouter} from "vue-router";
import type {Response, Router} from "../utils/Common.ts";
import {useStore} from "../store/store.ts";

onMounted(() => {
  getCaptchaImage()
})
onUnmounted(() => {
  clearInterval(intervalId)
})

let intervalId: undefined | NodeJS.Timeout;
const store = useStore();
const router = useRouter()
const toast = useToast()
const state = reactive({
  username: "",
  password: "",
  code: "",
  uuid: ""
})
const captchaSrc = ref("")
const schema = v.object({
  username: v.pipe(v.string(), v.minLength(5, "账号最低5个字符")),
  password: v.pipe(v.string(), v.minLength(8, "密码最低8个字符")),
  code: v.pipe(v.string(), v.minLength(4, "请输入合法的验证码")),
})

async function getCaptchaImage() {
  clearInterval(intervalId)
  intervalId = setInterval(getCaptchaImage, 5 * 60 * 1000)
  const res = await get<BlobPart>("/captchaImage", {
    params: {
      timestamp: new Date().getTime(),
    },
    responseType: "arraybuffer"
  })
  if (res.status === 200) {
    const blob = new Blob([res.data], {type: "image/jpeg"})
    const fileReader = new FileReader()
    fileReader.readAsDataURL(blob)
    fileReader.onloadend = (ev) => {
      captchaSrc.value = ev.target?.result as string
      state.uuid = res.headers.authorization.replace("captcha_codes:", "")
    }
  }

}

async function onSubmit() {
  const res = await post<Response<null>>("/login", state)
  if (res.data.code === 0) {
    toast.add({title: "成功", description: "登录成功", color: "success"})
    if (res.data.token != null) {
      store.token = res.data.token
      const {data} = await get<Response<null>>("/getinfo")
      if (data.code === 0) {
        store.user = data.user
        store.permissions = data.permissions
        store.isDefaultModifyPwd = data.isDefaultModifyPwd
        store.isPasswordExpired = data.isPasswordExpired
      }
      const {data: addRoute} = await get<Response<Router[]>>("/routers")
      store.originalRouter = addRoute.data
    }
    await router.push({name: "Home"})
  }
}
</script>

<template>
  <div class="login_container w-full h-screen flex justify-center items-center">
    <UForm class="w-1/3" :schema="schema" :state="state" @submit="onSubmit">
      <UCard>
        <template #header>
          <div class="font-bold text-2xl text-center">用户登录</div>
        </template>
        <div class="flex flex-col gap-4">
          <UFormField label="账号" name="account" required>
            <UInput class="w-full" v-model="state.username"/>
          </UFormField>
          <UFormField label="密码" name="account" required>
            <UInput class="w-full" type="password" v-model="state.password"/>
          </UFormField>
          <UFormField label="验证码" name="captcha" required>
            <div class="flex gap-4 justify-between">
              <UInput class="w-full" v-model="state.code"/>
              <img @click="getCaptchaImage" :src="captchaSrc" alt="captcha"/>
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