<script setup lang="ts">

import {useTemplateRef} from "vue";

const table = useTemplateRef("table");
</script>

<template>
  <UCard>
    <template #header>
      <ActionGroup :table="table"/>
    </template>
    <UTable ref="table"/>
  </UCard>
</template>

<style scoped>

</style>