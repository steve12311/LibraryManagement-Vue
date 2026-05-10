import type { MapPoint } from "@/api/library-map-api";

export type { MapPoint };

export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

export function clampToViewBox(x: number, y: number) {
  return {
    x: Math.round(Math.max(0, Math.min(1000, x))),
    y: Math.round(Math.max(0, Math.min(640, y))),
  };
}

export function clampShelfCoord(pos: number, size: number, maxBound: number) {
  return Math.max(0, Math.min(pos, maxBound - size));
}

export function parseOutline(outlineJson?: string): MapPoint[] {
  if (!outlineJson) return [];
  try {
    const parsed = JSON.parse(outlineJson) as MapPoint[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
      .map((item) => ({ x: Number(item.x), y: Number(item.y) }));
  } catch {
    return [];
  }
}
