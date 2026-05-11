<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  shelfNo: string;
  usedStock: number;
  capacity: number;
}>();

const el = ref<HTMLElement>();

watch(() => [props.x, props.y], () => {
  if (el.value) {
    el.value.style.left = `${props.x + 12}px`;
    el.value.style.top = `${props.y + 12}px`;
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="el"
      class="shelf-tooltip"
    >
      <span class="shelf-tooltip__no">{{ shelfNo }}</span>
      <span class="shelf-tooltip__usage">{{ usedStock }}/{{ capacity }}</span>
    </div>
  </Teleport>
</template>

<style scoped>
.shelf-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  white-space: nowrap;
}

.shelf-tooltip__no {
  font-weight: 700;
  color: var(--ui-text);
}

.shelf-tooltip__usage {
  color: var(--ui-text-muted);
}
</style>
