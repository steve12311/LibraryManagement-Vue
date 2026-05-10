import { onBeforeUnmount, ref } from "vue";
import { clampShelfCoord, clampToViewBox, svgPoint, type MapPoint } from "@/utils/svg-coords";

export interface UseSvgDragOptions {
  onShelfMove: (shelfId: number, x: number, y: number) => void;
  onShelfRotate: (shelfId: number, angle: number) => void;
  onPointMove: (index: number, point: MapPoint) => void;
  onClickCanvas: (x: number, y: number) => void;
  onSelectShelf: (shelfId: number) => void;
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

  function handleShelfMouseDown(
    event: MouseEvent,
    shelfId: number,
    shelfX: number,
    shelfY: number,
    shelfW: number,
    shelfH: number,
  ) {
    if (!svgRef.value) return;
    const { x, y } = svgPoint(svgRef.value, event.clientX, event.clientY);
    draggingShelfId.value = shelfId;
    dragStart.value = { x, y, shelfX, shelfY, shelfW, shelfH };
    options.onSelectShelf(shelfId);
    addDocListeners();
  }

  function handleOutlinePointMouseDown(_event: MouseEvent, index: number) {
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
      const newX = Math.round(clampShelfCoord(ds.shelfX + dx, ds.shelfW, 1000));
      const newY = Math.round(clampShelfCoord(ds.shelfY + dy, ds.shelfH, 640));
      options.onShelfMove(draggingShelfId.value, newX, newY);
      return;
    }

    if (rotatingShelfId.value != null && rotateStartAngle.value != null && rotateCenter.value) {
      const { x: cx, y: cy } = rotateCenter.value;
      const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI) - rotateStartAngle.value;
      const clampedAngle = Math.round(((angle % 360) + 360) % 360);
      options.onShelfRotate(rotatingShelfId.value, clampedAngle);
    }
  }

  function handleDocMouseUp() {
    const hadDrag = isDragging();
    draggingPointIndex.value = undefined;
    draggingShelfId.value = undefined;
    dragStart.value = undefined;
    rotatingShelfId.value = undefined;
    rotateStartAngle.value = undefined;
    rotateCenter.value = undefined;
    if (hadDrag) {
      justMoved.value = true;
    }
    removeDocListeners();
  }

  return {
    svgRef,
    draggingShelfId,
    handleShelfMouseDown,
    handleOutlinePointMouseDown,
    handleRotateMouseDown,
    handleMapClick,
  };
}
