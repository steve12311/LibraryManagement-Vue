<script setup lang="ts">
defineProps<{
  loading: boolean
  avatar?: string
  displayName: string
  username: string
  roleItems: string[]
  stats: Array<{ label: string; value: string }>
  details: Array<{ label: string; value: string }>
  disableProfileAction?: boolean
  disablePasswordAction?: boolean
}>()

const emit = defineEmits<{
  editProfile: []
  editPassword: []
}>()
</script>

<template>
  <UCard class="overview-card" :ui="{ body: 'p-0' }">
    <div class="overview-hero">
      <div class="identity-block">
        <UAvatar :src="avatar" size="xl" icon="i-lucide-user" />
        <div class="identity-copy">
          <p class="identity-name">{{ displayName }}</p>
          <p class="identity-account">@{{ username || "未知账号" }}</p>
          <div class="identity-role-list">
            <UBadge
                v-for="role in roleItems"
                :key="role"
                color="info"
                variant="soft"
            >
              {{ role }}
            </UBadge>
            <span v-if="roleItems.length === 0" class="role-empty">暂无角色</span>
          </div>
        </div>
      </div>

      <div class="hero-actions">
        <UButton
            icon="i-lucide-pencil-line"
            variant="soft"
            :disabled="disableProfileAction"
            @click="emit('editProfile')"
        >
          编辑资料
        </UButton>
        <UButton
            icon="i-lucide-key-round"
            color="neutral"
            variant="ghost"
            :disabled="disablePasswordAction"
            @click="emit('editPassword')"
        >
          修改密码
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="overview-loading">
      <div v-for="item in 6" :key="item" class="loading-block" />
    </div>

    <div v-else class="overview-body">
      <div class="stats-grid">
        <div v-for="item in stats" :key="item.label" class="stat-item">
          <p class="stat-label">{{ item.label }}</p>
          <p class="stat-value">{{ item.value }}</p>
        </div>
      </div>

      <div class="detail-grid">
        <div v-for="item in details" :key="item.label" class="detail-item">
          <span class="detail-label">{{ item.label }}</span>
          <span class="detail-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.overview-card {
  border: 1px solid var(--library-border);
  border-radius: 28px;
  background: var(--library-card);
  box-shadow: var(--library-shadow-soft);
}

.overview-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 28px;
  border-bottom: 1px solid var(--library-border);
  background: color-mix(in srgb, var(--library-card) 82%, var(--library-surface-muted));
}

.identity-block {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
}

.identity-copy {
  min-width: 0;
}

.identity-name {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--library-text);
}

.identity-account {
  margin-top: 4px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.identity-role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.role-empty {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border: 1px dashed var(--library-border-strong);
  border-radius: 9999px;
  font-size: 12px;
  color: var(--library-text-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-loading {
  display: grid;
  gap: 12px;
  padding: 24px 28px 28px;
}

.loading-block {
  height: 78px;
  border-radius: 18px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--library-card-muted) 86%, transparent) 0%, var(--library-card) 100%);
  animation: pulse 1.4s ease-in-out infinite;
}

.overview-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0 28px 28px;
}

.stats-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-item {
  border-radius: 20px;
  padding: 18px 20px;
  background: var(--library-card-muted);
}

.stat-label {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--library-text-muted);
  text-transform: uppercase;
}

.stat-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 800;
  color: var(--library-text);
}

.detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 18px;
  padding: 16px 18px;
  border: 1px solid var(--library-border);
  background: color-mix(in srgb, var(--library-card) 82%, var(--library-card-muted));
}

.detail-label {
  font-size: 12px;
  color: var(--library-text-muted);
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--library-text);
  word-break: break-all;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@media (max-width: 1024px) {
  .stats-grid,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-hero,
  .overview-loading,
  .overview-body {
    padding-inline: 20px;
  }

  .stats-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .identity-name {
    font-size: 24px;
  }
}
</style>
