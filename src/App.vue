<script setup lang="ts">
import {zh_cn} from "@nuxt/ui/locale"
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {ElConfigProvider} from "element-plus";
</script>

<template>
  <Suspense>
    <ElConfigProvider :locale="zhCn">
      <UApp :locale="zh_cn">
        <RouterView/>
      </UApp>
    </ElConfigProvider>
  </Suspense>
</template>

<style scoped>

</style>
