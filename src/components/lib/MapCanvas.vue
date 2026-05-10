<script setup lang="ts">
import { computed } from "vue";
import type { BookshelfVO } from "@/api/library-map-api";
import { useSvgDrag } from "@/composables/useSvgDrag";
import type { MapPoint } from "@/utils/svg-coords";

const props = defineProps<{
  outlinePoints: MapPoint[];
  shelves: BookshelfVO[];
  selectedShelfId?: number;
  selectedFloorId?: number;
  drawingOutline: boolean;
}>();

const emit = defineEmits<{
  selectShelf: [shelfId: number];
  "update:shelfPosition": [shelfId: number, x: number, y: number];
  "update:shelfAngle": [shelfId: number, angle: number];
  "update:outlinePoint": [index: number, point: MapPoint];
  clickCanvas: [x: number, y: number];
  "update:drawingOutline": [value: boolean];
  removeLastPoint: [];
  clearOutline: [];
  saveOutline: [];
}>();

const outlinePointString = computed(() =>
  props.outlinePoints.map((point) => `${point.x},${point.y}`).join(" "),
);

const {
  svgRef,
  draggingShelfId,
  handleShelfMouseDown,
  handleOutlinePointMouseDown,
  handleRotateMouseDown,
  handleMapClick,
} = useSvgDrag({
  onShelfMove(shelfId, x, y) {
    emit("update:shelfPosition", shelfId, x, y);
  },
  onShelfRotate(shelfId, angle) {
    emit("update:shelfAngle", shelfId, angle);
  },
  onPointMove(index, point) {
    emit("update:outlinePoint", index, point);
  },
  onClickCanvas(x, y) {
    emit("clickCanvas", x, y);
  },
  onSelectShelf(shelfId) {
    emit("selectShelf", shelfId);
  },
});

// svgRef is used as template ref on <svg>
void svgRef;
</script>

<template>
  <section class="map-workspace">
    <div class="map-toolbar">
      <UButton
        :icon="drawingOutline ? 'i-lucide-pencil-off' : 'i-lucide-pencil'"
        :variant="drawingOutline ? 'solid' : 'subtle'"
        :disabled="!selectedFloorId"
        label="轮廓"
        @click="emit('update:drawingOutline', !drawingOutline)"
      />
      <UButton
        icon="i-lucide-undo-2"
        variant="ghost"
        :disabled="outlinePoints.length === 0"
        label="撤销点"
        @click="emit('removeLastPoint')"
      />
      <UButton
        icon="i-lucide-eraser"
        variant="ghost"
        :disabled="outlinePoints.length === 0"
        label="清空轮廓"
        @click="emit('clearOutline')"
      />
      <UButton
        icon="i-lucide-save"
        variant="subtle"
        :disabled="!selectedFloorId"
        label="保存轮廓"
        @click="emit('saveOutline')"
      />
    </div>

    <div class="map-canvas-frame">
      <svg
        ref="svgRef"
        class="map-canvas"
        viewBox="0 0 1000 640"
        role="img"
        @click="handleMapClick"
      >
        <polygon
          v-if="outlinePoints.length >= 3"
          :points="outlinePointString"
          class="floor-outline"
        />
        <polyline
          v-else-if="outlinePoints.length > 1"
          :points="outlinePointString"
          class="floor-outline-line"
        />
        <circle
          v-for="(point, index) in outlinePoints"
          :key="`${point.x}-${point.y}-${index}`"
          :cx="point.x"
          :cy="point.y"
          r="6"
          class="outline-point"
          :class="{ 'cursor-move': !drawingOutline, 'pointer-pass': drawingOutline }"
          @mousedown.prevent="!drawingOutline && handleOutlinePointMouseDown($event, index)"
        />
        <g
          v-for="shelf in shelves"
          :key="shelf.id"
          class="shelf-shape"
          :class="{ 'cursor-grab': !drawingOutline, 'cursor-grabbing': draggingShelfId === shelf.id }"
          :transform="`rotate(${Number(shelf.angle || 0)} ${Number(shelf.x) + Number(shelf.width) / 2} ${Number(shelf.y) + Number(shelf.height) / 2})`"
          @mousedown.prevent="!drawingOutline && handleShelfMouseDown($event, shelf.id, Number(shelf.x), Number(shelf.y), Number(shelf.width), Number(shelf.height))"
        >
          <rect
            :x="shelf.x"
            :y="shelf.y"
            :width="shelf.width"
            :height="shelf.height"
            rx="6"
            :class="{ selected: shelf.id === selectedShelfId, disabled: shelf.status !== 1 }"
          />
          <circle
            v-if="shelf.id === selectedShelfId"
            :cx="Number(shelf.x) + Number(shelf.width) / 2"
            :cy="Number(shelf.y) - 14"
            r="8"
            class="rotate-handle"
            @mousedown.prevent="!drawingOutline && handleRotateMouseDown($event, shelf.id, Number(shelf.x), Number(shelf.y), Number(shelf.width), Number(shelf.height), Number(shelf.angle || 0))"
          />
          <text
            :x="Number(shelf.x) + Number(shelf.width) / 2"
            :y="Number(shelf.y) + Number(shelf.height) / 2 + 5"
            text-anchor="middle"
          >
            {{ shelf.shelfNo }}
          </text>
        </g>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.map-workspace {
  display: flex;
  min-height: 560px;
  flex-direction: column;
  overflow: hidden;
}

.map-toolbar {
  justify-content: flex-start;
  border-bottom: 1px solid var(--library-border);
  padding: 10px;
}

.map-canvas-frame {
  min-height: 500px;
  flex: 1;
  padding: 12px;
}

.map-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid color-mix(in srgb, var(--library-accent) 55%, var(--library-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--library-card) 82%, white);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--library-accent) 12%, transparent);
}

.floor-outline {
  fill: color-mix(in srgb, var(--library-accent) 9%, transparent);
  stroke: var(--library-accent);
  stroke-width: 3;
}

.floor-outline-line {
  fill: none;
  stroke: var(--library-accent);
  stroke-width: 3;
  stroke-dasharray: 8 8;
}

.outline-point {
  fill: var(--library-accent);
  stroke: var(--library-card);
  stroke-width: 2;
  cursor: pointer;
}

.cursor-move {
  cursor: move;
}

.pointer-pass {
  pointer-events: none;
}

.shelf-shape rect {
  fill: color-mix(in srgb, var(--library-accent) 22%, var(--library-card));
  stroke: color-mix(in srgb, var(--library-accent) 72%, var(--library-border));
  stroke-width: 2;
  cursor: pointer;
}

.shelf-shape rect.selected {
  fill: color-mix(in srgb, var(--library-accent) 44%, var(--library-card));
  stroke-width: 4;
}

.shelf-shape rect.disabled {
  fill: color-mix(in srgb, var(--library-text-muted) 18%, var(--library-card));
  stroke: var(--library-border);
}

.shelf-shape text {
  pointer-events: none;
  fill: var(--library-text);
  font-size: 18px;
  font-weight: 700;
}

.rotate-handle {
  fill: var(--library-accent);
  stroke: var(--library-card);
  stroke-width: 2;
  cursor: pointer;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}
</style>
