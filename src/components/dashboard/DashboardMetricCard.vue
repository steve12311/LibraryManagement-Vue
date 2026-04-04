<script setup lang="ts">
defineProps<{
  title: string
  value: number
  description: string
  icon: string
  tone?: "sky" | "emerald" | "amber" | "rose" | "violet"
}>()

const toneClassMap = {
  sky: "bg-primary/10 text-primary ring-primary/15",
  emerald: "bg-success/10 text-success ring-success/15",
  amber: "bg-warning/10 text-warning ring-warning/15",
  rose: "bg-error/10 text-error ring-error/15",
  violet: "bg-secondary/10 text-secondary ring-secondary/15",
} as const
</script>

<template>
  <UCard
    class="h-full rounded-2xl border border-default bg-default shadow-sm"
    :class="toneClassMap[tone ?? 'sky']"
    :ui="{ body: 'p-5' }"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-2">
        <p class="text-xs font-semibold tracking-[0.24em] text-muted">{{ title }}</p>
        <p class="text-3xl font-bold text-highlighted">{{ value.toLocaleString('zh-CN') }}</p>
        <p class="text-sm text-muted">{{ description }}</p>
      </div>
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-default shadow-sm ring-1 ring-inset ring-default">
        <UIcon :name="icon" class="h-5 w-5"/>
      </div>
    </div>
  </UCard>
</template>
