<script setup lang="ts">
import { computed, ref } from "vue";
import { useSvgDrag } from "@/composables/useSvgDrag";
import { useSvgZoom } from "@/composables/useSvgZoom";
import { type MapPoint, type OutlineData } from "@/utils/svg-coords";
import ShelfTooltip from "@/components/lib/ShelfTooltip.vue";
import MapMinimap from "@/components/lib/MapMinimap.vue";
import type { MinimapShelf } from "@/components/lib/MapMinimap.vue";

export interface ShelfRenderItem {
  id: number;
  shelfNo: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  capacity: number;
  usedStock: number;
  status: number;
}

const props = withDefaults(defineProps<{
  outlinePoints: MapPoint[];
  outlineData?: OutlineData;
  shelves: ShelfRenderItem[];
  selectedShelfId?: number;
  selectedFloorId?: number;
  drawingOutline: boolean;
  readonly?: boolean;
  showGrid?: boolean;
}>(), {
  readonly: false,
  showGrid: false,
});

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
  copyShelf: [shelfId: number, x: number, y: number];
  "update:showGrid": [value: boolean];
}>();

const outlinePointString = computed(() =>
  props.outlinePoints.map((point) => `${point.x},${point.y}`).join(" "),
);

const tooltipVisible = ref(false);
const tooltipShelf = ref<ShelfRenderItem>();
const tooltipX = ref(0);
const tooltipY = ref(0);
const minimapCollapsed = ref(false);
let tooltipTimer: ReturnType<typeof setTimeout> | undefined;

const { zoomLevel, panX, panY, viewBox, zoomAt, panBy } = useSvgZoom();

const {
  svgRef,
  draggingShelfId,
  alignmentLines,
  panning,
  handleShelfMouseDown,
  handleOutlinePointMouseDown,
  handleRotateMouseDown,
  handleSvgMouseDown,
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
  onCopyShelf(shelfId, x, y) {
    emit("copyShelf", shelfId, x, y);
  },
  onPan(dx, dy) {
    panBy(dx, dy);
  },
  getZoomState: () => ({ zoomLevel: zoomLevel.value, panX: panX.value, panY: panY.value }),
  getAllShelves: () => props.shelves.map((s) => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height })),
  isReadonly: () => props.readonly,
});

void svgRef;

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  if (!svgRef.value) return;
  const pt = svgRef.value.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svgRef.value.getScreenCTM();
  if (!ctm) return;
  const svgPt = pt.matrixTransform(ctm.inverse());
  zoomAt(svgPt.x, svgPt.y, e.deltaY);
}

function shelfColor(status: number, usedStock: number, capacity: number): string {
  if (status !== 1) return "#6c7086";
  const ratio = capacity > 0 ? usedStock / capacity : 0;
  if (ratio < 0.5) return "#a6e3a1";
  if (ratio < 0.8) return "#f9e2af";
  return "#f38ba8";
}

function onShelfMouseEnter(event: MouseEvent, shelf: ShelfRenderItem) {
  tooltipX.value = event.clientX;
  tooltipY.value = event.clientY;
  tooltipTimer = setTimeout(() => {
    tooltipShelf.value = shelf;
    tooltipVisible.value = true;
  }, 300);
}

function onShelfMouseMove(event: MouseEvent) {
  if (tooltipVisible.value) {
    tooltipX.value = event.clientX;
    tooltipY.value = event.clientY;
  }
}

function onShelfMouseLeave() {
  if (tooltipTimer) clearTimeout(tooltipTimer);
  tooltipVisible.value = false;
  tooltipShelf.value = undefined;
}

const minimapShelves = computed<MinimapShelf[]>(() =>
  props.shelves.map((s) => ({
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    angle: s.angle,
    usageRatio: s.capacity > 0 ? s.usedStock / s.capacity : 0,
    status: s.status,
  })),
);

const viewBoxParts = computed(() => {
  const parts = viewBox.value.split(" ").map(Number);
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
});

function onMinimapNavigate(x: number, y: number) {
  panX.value = x;
  panY.value = y;
}
</script>

<template>
  <section class="map-workspace">
    <div v-if="!readonly" class="map-toolbar">
      <UButton
        icon="i-lucide-grid-3x3"
        :variant="showGrid ? 'solid' : 'ghost'"
        label="网格"
        @click="emit('update:showGrid', !showGrid)"
      />
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

    <div class="map-canvas-frame" :class="{ panning }">
      <svg
        ref="svgRef"
        class="map-canvas"
        :viewBox="viewBox"
        role="img"
        tabindex="0"
        @click="handleMapClick"
        @mousedown="handleSvgMouseDown"
        @wheel.prevent="handleWheel"
      >
        <!-- Grid layer -->
        <defs>
          <pattern
            id="map-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6c7086" stroke-width="0.3" opacity="0.3" />
          </pattern>
        </defs>
        <rect
          v-if="showGrid && !readonly"
          x="0"
          y="0"
          width="1000"
          height="640"
          fill="url(#map-grid)"
        />

        <!-- Background image layer -->
        <image
          v-if="outlineData?.imageUrl"
          :href="outlineData.imageUrl"
          :width="outlineData.imageWidth || 1000"
          :height="outlineData.imageHeight || 640"
          opacity="0.4"
        />

        <!-- Floor outline -->
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

        <!-- Outline points (admin only) -->
        <template v-if="!readonly">
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
        </template>

        <!-- Alignment lines -->
        <line
          v-for="(line, i) in alignmentLines"
          :key="`al-${i}`"
          :x1="line.type === 'h' ? 0 : line.pos"
          :y1="line.type === 'h' ? line.pos : 0"
          :x2="line.type === 'h' ? 1000 : line.pos"
          :y2="line.type === 'h' ? line.pos : 640"
          stroke="#f38ba8"
          stroke-width="1"
          stroke-dasharray="6 4"
        />

        <!-- Shelves -->
        <g
          v-for="shelf in shelves"
          :key="shelf.id"
          class="shelf-shape"
          :class="{
            'cursor-grab': !readonly && !drawingOutline,
            'cursor-grabbing': draggingShelfId === shelf.id,
          }"
          :transform="`rotate(${Number(shelf.angle || 0)} ${Number(shelf.x) + Number(shelf.width) / 2} ${Number(shelf.y) + Number(shelf.height) / 2})`"
          @mousedown.prevent="!drawingOutline && handleShelfMouseDown($event, shelf.id, Number(shelf.x), Number(shelf.y), Number(shelf.width), Number(shelf.height))"
          @mouseenter="onShelfMouseEnter($event, shelf)"
          @mousemove="onShelfMouseMove"
          @mouseleave="onShelfMouseLeave"
        >
          <rect
            :x="shelf.x"
            :y="shelf.y"
            :width="shelf.width"
            :height="shelf.height"
            rx="6"
            :fill="shelfColor(shelf.status, shelf.usedStock, shelf.capacity)"
            :class="{ selected: shelf.id === selectedShelfId, disabled: shelf.status !== 1 }"
          />
          <circle
            v-if="!readonly && shelf.id === selectedShelfId"
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

      <MapMinimap
        :outline-points="outlinePoints"
        :shelves="minimapShelves"
        :view-box-x="viewBoxParts.x"
        :view-box-y="viewBoxParts.y"
        :view-box-w="viewBoxParts.w"
        :view-box-h="viewBoxParts.h"
        :collapsed="minimapCollapsed"
        @update:collapsed="minimapCollapsed = $event"
        @navigate-to="onMinimapNavigate"
      />
    </div>

    <ShelfTooltip
      :visible="tooltipVisible"
      :x="tooltipX"
      :y="tooltipY"
      :shelf-no="tooltipShelf?.shelfNo || ''"
      :used-stock="tooltipShelf?.usedStock || 0"
      :capacity="tooltipShelf?.capacity || 0"
    />
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
  display: flex;
  gap: 4px;
}

.map-canvas-frame {
  min-height: 500px;
  flex: 1;
  padding: 12px;
  position: relative;
  overflow: hidden;
}

.map-canvas-frame.panning {
  cursor: grabbing;
}

.map-canvas {
  position: absolute;
  inset: 12px;
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
  stroke: color-mix(in srgb, var(--library-accent) 72%, var(--library-border));
  stroke-width: 2;
  cursor: pointer;
  transition: fill 0.2s;
}

.shelf-shape rect.selected {
  stroke-width: 4;
}

.shelf-shape rect.disabled {
  opacity: 0.5;
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
