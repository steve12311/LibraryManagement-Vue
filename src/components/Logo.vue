<script setup lang="ts">
const brandTitle = import.meta.env.VITE_APP_BRAND_TITLE || "校园图书馆"
const brandSubtitle = import.meta.env.VITE_APP_BRAND_SUBTITLE || "Campus Library"

withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false
});
</script>

<template>
  <div class="logo-mark" :class="{ collapsed }">
    <div class="logo-icon">
      <UIcon name="i-lucide-library-big" class="h-5 w-5" />
    </div>
    <div v-if="!collapsed" class="logo-copy">
      <p class="logo-title">{{ brandTitle }}</p>
      <p class="logo-subtitle">{{ brandSubtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.logo-mark {
  display: inline-flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.logo-mark.collapsed {
  justify-content: center;
  width: 100%;
}

.logo-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background:
      linear-gradient(145deg, var(--library-accent) 0%, var(--library-accent-strong) 100%);
  color: white;
  box-shadow: 0 12px 24px rgb(0 99 152 / 16%);
  flex-shrink: 0;
}

.logo-copy {
  min-width: 0;
  padding-top: 1px;
}

.logo-title {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  color: var(--library-text);
}

.logo-subtitle {
  margin-top: 5px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--library-text-muted);
}
</style>
