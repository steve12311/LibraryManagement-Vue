<template>
  <div class="system-query-card">
    <div v-if="$slots.actions" class="system-query-card__actions">
      <slot name="actions" />
    </div>
    <div v-if="$slots.default" class="system-query-card__body">
      <slot />
    </div>
  </div>
</template>
