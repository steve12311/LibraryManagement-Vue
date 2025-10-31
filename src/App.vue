<script setup lang="ts">
import {zh_cn} from "@nuxt/ui/locale"
</script>

<template>
  <Suspense>
    <UApp :locale="zh_cn">
      <RouterView />
    </UApp>
  </Suspense>
</template>

<style scoped>

</style>
