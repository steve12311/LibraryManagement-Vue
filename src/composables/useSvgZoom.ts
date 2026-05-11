import { computed, ref } from "vue";

export interface ZoomState {
  zoomLevel: number;
  panX: number;
  panY: number;
}

export function useSvgZoom(initialZoom = 1, initialPanX = 0, initialPanY = 0) {
  const zoomLevel = ref(Math.max(0.3, Math.min(3, initialZoom)));
  const panX = ref(initialPanX);
  const panY = ref(initialPanY);

  const viewBox = computed(() => {
    const w = 1000 / zoomLevel.value;
    const h = 640 / zoomLevel.value;
    return `${panX.value} ${panY.value} ${w} ${h}`;
  });

  function zoomAt(svgCenterX: number, svgCenterY: number, delta: number) {
    const oldZoom = zoomLevel.value;
    const newZoom = Math.max(0.3, Math.min(3, oldZoom * (delta < 0 ? 1.15 : 0.85)));
    const ratio = 1 - oldZoom / newZoom;
    panX.value += (svgCenterX - panX.value) * ratio;
    panY.value += (svgCenterY - panY.value) * ratio;
    zoomLevel.value = newZoom;
  }

  function panBy(dx: number, dy: number) {
    panX.value += dx;
    panY.value += dy;
  }

  function fitBounds(minX: number, minY: number, maxX: number, maxY: number) {
    const contentW = maxX - minX || 1000;
    const contentH = maxY - minY || 640;
    const padding = 40;
    const zx = 1000 / (contentW + padding * 2);
    const zy = 640 / (contentH + padding * 2);
    const newZoom = Math.max(0.3, Math.min(3, Math.min(zx, zy) * 0.9));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    zoomLevel.value = newZoom;
    panX.value = centerX - 500 / newZoom;
    panY.value = centerY - 320 / newZoom;
  }

  function resetZoom() {
    zoomLevel.value = 1;
    panX.value = 0;
    panY.value = 0;
  }

  return { zoomLevel, panX, panY, viewBox, zoomAt, panBy, fitBounds, resetZoom };
}
