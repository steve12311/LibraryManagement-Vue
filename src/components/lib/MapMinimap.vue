<script setup lang="ts">
import { computed } from "vue";
import type { MapPoint } from "@/utils/svg-coords";

export interface MinimapShelf {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  usageRatio: number;
  status: number;
}

const props = defineProps<{
  outlinePoints: MapPoint[];
  shelves: MinimapShelf[];
  viewBoxX: number;
  viewBoxY: number;
  viewBoxW: number;
  viewBoxH: number;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  navigateTo: [x: number, y: number];
}>();

const MINIMAP_W = 140;
const MINIMAP_H = 100;
const scaleX = MINIMAP_W / 1000;
const scaleY = MINIMAP_H / 640;

const outlinePointsStr = computed(() =>
  props.outlinePoints.map((p) => `${p.x * scaleX},${p.y * scaleY}`).join(" "),
);

const viewportRect = computed(() => ({
  x: props.viewBoxX * scaleX,
  y: props.viewBoxY * scaleY,
  w: props.viewBoxW * scaleX,
  h: props.viewBoxH * scaleY,
}));

function shelfColor(ratio: number, status: number): string {
  if (status !== 1) return "#6c7086";
  if (ratio < 0.5) return "#a6e3a1";
  if (ratio < 0.8) return "#f9e2af";
  return "#f38ba8";
}

function handleMinimapClick(e: MouseEvent) {
  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scaleX;
  const my = (e.clientY - rect.top) / scaleY;
  emit("navigateTo", mx - 500 / (props.viewBoxH ? 640 / props.viewBoxH : 1), my);
}
</script>

<template>
  <div class="map-minimap" :class="{ collapsed }">
    <button class="map-minimap__toggle" @click="emit('update:collapsed', !collapsed)">
      {{ collapsed ? "+" : "-" }}
    </button>
    <svg
      v-if="!collapsed"
      :width="MINIMAP_W"
      :height="MINIMAP_H"
      viewBox="0 0 140 100"
      class="map-minimap__svg"
      @click="handleMinimapClick"
    >
      <polygon
        v-if="outlinePoints.length >= 3"
        :points="outlinePointsStr"
        class="minimap-outline"
      />
      <rect
        v-for="(shelf, i) in shelves"
        :key="i"
        :x="shelf.x * scaleX"
        :y="shelf.y * scaleY"
        :width="Math.max(shelf.width * scaleX, 1)"
        :height="Math.max(shelf.height * scaleY, 1)"
        :fill="shelfColor(shelf.usageRatio, shelf.status)"
        opacity="0.8"
      />
      <rect
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.w"
        :height="viewportRect.h"
        fill="none"
        stroke="#89b4fa"
        stroke-width="2"
        class="minimap-viewport"
      />
    </svg>
  </div>
</template>

<style scoped>
.map-minimap {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  border-radius: 10px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.10);
  padding: 6px;
}

.map-minimap.collapsed {
  padding: 4px 8px;
}

.map-minimap__toggle {
  display: block;
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1;
  color: var(--ui-text-muted);
  cursor: pointer;
  border: none;
  background: none;
}

.map-minimap__svg {
  display: block;
  border-radius: 4px;
  cursor: pointer;
  background: var(--ui-bg-elevated);
}

.minimap-outline {
  fill: color-mix(in srgb, var(--library-accent) 6%, transparent);
  stroke: color-mix(in srgb, var(--library-accent) 40%, transparent);
  stroke-width: 0.5;
}

.minimap-viewport {
  pointer-events: none;
}
</style>
