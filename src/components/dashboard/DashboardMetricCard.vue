<script setup lang="ts">
defineProps<{
  title: string
  value: number
  description: string
  icon: string
  tone?: "sky" | "emerald" | "amber" | "rose" | "violet"
}>()

const toneClassMap = {
  sky: "from-cyan-50 via-sky-50 to-white text-cyan-700 ring-cyan-100",
  emerald: "from-emerald-50 via-teal-50 to-white text-emerald-700 ring-emerald-100",
  amber: "from-amber-50 via-orange-50 to-white text-amber-700 ring-amber-100",
  rose: "from-rose-50 via-pink-50 to-white text-rose-700 ring-rose-100",
  violet: "from-violet-50 via-indigo-50 to-white text-violet-700 ring-violet-100",
} as const
</script>

<template>
  <UCard
    class="h-full rounded-2xl border border-default bg-gradient-to-br shadow-sm"
    :class="toneClassMap[tone ?? 'sky']"
    :ui="{ body: 'p-5' }"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-2">
        <p class="text-xs font-semibold tracking-[0.24em] text-muted">{{ title }}</p>
        <p class="text-3xl font-bold text-highlighted">{{ value.toLocaleString('zh-CN') }}</p>
        <p class="text-sm text-muted">{{ description }}</p>
      </div>
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-inset ring-white/90">
        <UIcon :name="icon" class="h-5 w-5"/>
      </div>
    </div>
  </UCard>
</template>
