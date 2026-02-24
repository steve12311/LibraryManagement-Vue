<script setup lang="ts">
import {ref} from "vue";
import AISidebar from "@/components/lib-stock/AISidebar.vue";

const openAISidebar = ref(false)
</script>

<template>
  <div class="relative min-h-50">
    <UButton
        class="absolute z-10 right-10 bottom-10"
        icon="i-lucide-bot"
        label="智慧咨询"
        @click="openAISidebar = true"
    />
    <AISidebar v-model:open="openAISidebar"/>
  </div>
</template>

<style scoped>

</style>
