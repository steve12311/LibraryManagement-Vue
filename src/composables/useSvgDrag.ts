import { onBeforeUnmount, ref } from "vue";
import { clampShelfCoord, clampToViewBox, svgPoint, type MapPoint } from "@/utils/svg-coords";
import type { ZoomState } from "@/composables/useSvgZoom";

export interface AlignmentLine {
  type: "h" | "v";
  pos: number;
}

export interface UseSvgDragOptions {
  onShelfMove: (shelfId: number, x: number, y: number) => void;
  onShelfRotate: (shelfId: number, angle: number) => void;
  onPointMove: (index: number, point: MapPoint) => void;
  onClickCanvas: (x: number, y: number) => void;
  onSelectShelf: (shelfId: number) => void;
  onCopyShelf: (shelfId: number, x: number, y: number) => void;
  onPan: (dx: number, dy: number) => void;
  getZoomState: () => ZoomState;
  getAllShelves: () => { id: number; x: number; y: number; width: number; height: number }[];
  isReadonly?: () => boolean;
}

interface DragStart {
  x: number;
  y: number;
  shelfX: number;
  shelfY: number;
  shelfW: number;
  shelfH: number;
}

export function useSvgDrag(options: UseSvgDragOptions) {
  const svgRef = ref<SVGSVGElement>();
  const draggingShelfId = ref<number>();
  const rotatingShelfId = ref<number>();
  const dragStart = ref<DragStart>();
  const rotateStartAngle = ref<number>();
  const rotateCenter = ref<{ x: number; y: number }>();
  const draggingPointIndex = ref<number>();
  const justMoved = ref(false);
  const panning = ref(false);
  const panLast = ref<{ x: number; y: number }>();
  const alignmentLines = ref<AlignmentLine[]>([]);

  function isDragging() {
    return draggingPointIndex.value != null || draggingShelfId.value != null || rotatingShelfId.value != null;
  }

  function addDocListeners() {
    document.addEventListener("mousemove", handleDocMouseMove);
    document.addEventListener("mouseup", handleDocMouseUp);
  }

  function removeDocListeners() {
    document.removeEventListener("mousemove", handleDocMouseMove);
    document.removeEventListener("mouseup", handleDocMouseUp);
  }

  onBeforeUnmount(() => {
    removeDocListeners();
  });

  const GRID = 20;
  const SNAP_THRESHOLD = 8;
  const ALIGN_THRESHOLD = 6;

  function snapToGrid(val: number): number {
    const snapped = Math.round(val / GRID) * GRID;
    return Math.abs(val - snapped) <= SNAP_THRESHOLD ? snapped : val;
  }

  function computeAlignment(
    shelfId: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): { x: number; y: number; lines: AlignmentLine[] } {
    const lines: AlignmentLine[] = [];
    let newX = x;
    let newY = y;
    const others = options.getAllShelves().filter((s) => s.id !== shelfId);

    // Check 3 edges per axis: left/top, center, right/bottom
    const myEdgesH = [y, y + h, y + h / 2]; // top, bottom, center
    const myEdgesV = [x, x + w, x + w / 2]; // left, right, center

    for (const other of others) {
      const oEdgesH = [other.y, other.y + other.height, other.y + other.height / 2];
      const oEdgesV = [other.x, other.x + other.width, other.x + other.width / 2];

      for (let i = 0; i < 3; i++) {
        const distH = Math.abs(myEdgesH[i] - oEdgesH[i]);
        if (distH < ALIGN_THRESHOLD) {
          lines.push({ type: "h", pos: oEdgesH[i] });
          newY += oEdgesH[i] - myEdgesH[i];
          break;
        }
        const distV = Math.abs(myEdgesV[i] - oEdgesV[i]);
        if (distV < ALIGN_THRESHOLD) {
          lines.push({ type: "v", pos: oEdgesV[i] });
          newX += oEdgesV[i] - myEdgesV[i];
          break;
        }
      }
    }
    return { x: Math.round(newX), y: Math.round(newY), lines };
  }

  function handleShelfMouseDown(
    event: MouseEvent,
    shelfId: number,
    shelfX: number,
    shelfY: number,
    shelfW: number,
    shelfH: number,
  ) {
    if (options.isReadonly?.()) return;
    if (!svgRef.value) return;
    if (event.button === 1) return;
    const { x, y } = svgPoint(svgRef.value, event.clientX, event.clientY);
    if (event.altKey) {
      options.onCopyShelf(shelfId, Math.round(x - shelfW / 2), Math.round(y - shelfH / 2));
      return;
    }
    draggingShelfId.value = shelfId;
    dragStart.value = { x, y, shelfX, shelfY, shelfW, shelfH };
    options.onSelectShelf(shelfId);
    addDocListeners();
  }

  function handleOutlinePointMouseDown(_event: MouseEvent, index: number) {
    if (options.isReadonly?.()) return;
    draggingPointIndex.value = index;
    addDocListeners();
  }

  function handleRotateMouseDown(
    event: MouseEvent,
    shelfId: number,
    shelfX: number,
    shelfY: number,
    shelfW: number,
    shelfH: number,
    currentAngle: number,
  ) {
    if (options.isReadonly?.()) return;
    event.stopPropagation();
    if (!svgRef.value) return;
    const { x, y } = svgPoint(svgRef.value, event.clientX, event.clientY);
    const cx = shelfX + shelfW / 2;
    const cy = shelfY + shelfH / 2;
    rotatingShelfId.value = shelfId;
    rotateCenter.value = { x: cx, y: cy };
    rotateStartAngle.value = Math.atan2(y - cy, x - cx) * (180 / Math.PI) - currentAngle;
    options.onSelectShelf(shelfId);
    addDocListeners();
  }

  function handleSvgMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      panning.value = true;
      panLast.value = { x: event.clientX, y: event.clientY };
      addDocListeners();
    }
  }

  function handleMapClick(event: MouseEvent) {
    if (justMoved.value) {
      justMoved.value = false;
      return;
    }
    if (!svgRef.value) return;
    const raw = svgPoint(svgRef.value, event.clientX, event.clientY);
    const { x, y } = clampToViewBox(raw.x, raw.y);
    options.onClickCanvas(x, y);
  }

  function handleDocMouseMove(event: MouseEvent) {
    if (!svgRef.value) return;

    if (panning.value && panLast.value) {
      const dx = event.clientX - panLast.value.x;
      const dy = event.clientY - panLast.value.y;
      panLast.value = { x: event.clientX, y: event.clientY };
      const z = options.getZoomState().zoomLevel;
      options.onPan(-dx / z, -dy / z);
      return;
    }

    const { x, y } = svgPoint(svgRef.value, event.clientX, event.clientY);

    if (draggingPointIndex.value != null) {
      const idx = draggingPointIndex.value;
      options.onPointMove(idx, clampToViewBox(x, y));
      return;
    }

    if (draggingShelfId.value != null && dragStart.value) {
      const ds = dragStart.value;
      const dx = x - ds.x;
      const dy = y - ds.y;
      let newX = Math.round(clampShelfCoord(ds.shelfX + dx, ds.shelfW, 1000));
      let newY = Math.round(clampShelfCoord(ds.shelfY + dy, ds.shelfH, 640));

      if (event.shiftKey) {
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        alignmentLines.value = [];
      } else {
        const result = computeAlignment(draggingShelfId.value, newX, newY, ds.shelfW, ds.shelfH);
        newX = result.x;
        newY = result.y;
        alignmentLines.value = result.lines;
      }

      options.onShelfMove(draggingShelfId.value, newX, newY);
      return;
    }

    if (rotatingShelfId.value != null && rotateStartAngle.value != null && rotateCenter.value) {
      const { x: cx, y: cy } = rotateCenter.value;
      let angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI) - rotateStartAngle.value;
      angle = ((angle % 360) + 360) % 360;
      if (event.shiftKey) {
        angle = Math.round(angle / 15) * 15;
      }
      options.onShelfRotate(rotatingShelfId.value, Math.round(angle));
    }
  }

  function handleDocMouseUp() {
    const hadDrag = isDragging() || panning.value;
    draggingPointIndex.value = undefined;
    draggingShelfId.value = undefined;
    dragStart.value = undefined;
    rotatingShelfId.value = undefined;
    rotateStartAngle.value = undefined;
    rotateCenter.value = undefined;
    panning.value = false;
    panLast.value = undefined;
    alignmentLines.value = [];
    if (hadDrag) {
      justMoved.value = true;
    }
    removeDocListeners();
  }

  return {
    svgRef,
    draggingShelfId,
    alignmentLines,
    panning,
    handleShelfMouseDown,
    handleOutlinePointMouseDown,
    handleRotateMouseDown,
    handleSvgMouseDown,
    handleMapClick,
  };
}
