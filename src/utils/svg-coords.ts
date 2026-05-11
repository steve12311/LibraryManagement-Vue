import type { MapPoint } from "@/api/library-map-api";

export type { MapPoint };

export interface OutlineData {
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  points: MapPoint[];
}

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

function isMapPointArray(arr: unknown): arr is MapPoint[] {
  if (!Array.isArray(arr)) return false;
  return arr.every((item) => typeof item === "object" && item !== null && "x" in item && "y" in item);
}

export function parseOutline(outlineJson?: string): MapPoint[] {
  if (!outlineJson) return [];
  try {
    const parsed = JSON.parse(outlineJson) as unknown;
    if (isMapPointArray(parsed)) {
      return parsed
        .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
        .map((item) => ({ x: Number(item.x), y: Number(item.y) }));
    }
    if (typeof parsed === "object" && parsed !== null && "points" in parsed) {
      const data = parsed as { points: unknown };
      if (isMapPointArray(data.points)) {
        return data.points
          .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
          .map((item) => ({ x: Number(item.x), y: Number(item.y) }));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function parseOutlineData(outlineJson?: string): OutlineData {
  if (!outlineJson) return { points: [] };
  try {
    const parsed = JSON.parse(outlineJson) as unknown;
    if (isMapPointArray(parsed)) {
      return { points: parsed.map((p) => ({ x: Number(p.x), y: Number(p.y) })) };
    }
    if (typeof parsed === "object" && parsed !== null) {
      const data = parsed as Record<string, unknown>;
      const points: MapPoint[] = isMapPointArray(data.points)
        ? data.points.map((p: MapPoint) => ({ x: Number(p.x), y: Number(p.y) }))
        : [];
      return {
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
        imageWidth: typeof data.imageWidth === "number" ? data.imageWidth : undefined,
        imageHeight: typeof data.imageHeight === "number" ? data.imageHeight : undefined,
        points,
      };
    }
    return { points: [] };
  } catch {
    return { points: [] };
  }
}
