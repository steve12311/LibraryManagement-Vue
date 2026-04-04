<script setup lang="ts">
type SystemPageStat = {
  label: string
  value: string | number
}

withDefaults(defineProps<{
  kicker?: string
  title: string
  description?: string
  stats?: SystemPageStat[]
}>(), {
  kicker: "",
  description: "",
  stats: () => []
})
</script>

<template>
  <div class="system-page-header">
    <div class="system-page-header__copy">
      <p v-if="kicker" class="system-page-header__kicker">{{ kicker }}</p>
      <h1 class="system-page-header__title">{{ title }}</h1>
      <p v-if="description" class="system-page-header__description">{{ description }}</p>
    </div>
    <div v-if="stats.length" class="system-page-header__stats">
      <div v-for="item in stats" :key="item.label" class="system-page-header__stat">
        <span class="system-page-header__stat-label">{{ item.label }}</span>
        <strong class="system-page-header__stat-value">{{ item.value }}</strong>
      </div>
    </div>
    <div v-else-if="$slots.actions" class="system-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
