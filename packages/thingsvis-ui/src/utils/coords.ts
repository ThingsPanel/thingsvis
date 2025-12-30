import type { CanvasState } from '@thingsvis/kernel';

export type Point = { x: number; y: number };

export function screenToCanvas(
  screenPoint: Point,
  canvasConfig: Pick<CanvasState, 'mode' | 'width' | 'height'>,
  viewportState: { width: number; height: number; zoom: number; offsetX: number; offsetY: number }
): Point {
  const { mode, width = 1920, height = 1080 } = canvasConfig;
  const { width: vpW, height: vpH, zoom, offsetX, offsetY } = viewportState;

  if (mode === "fixed") {
    // Centered: compute canvas origin centered in viewport
    const originX = (vpW - width * zoom) / 2;
    const originY = (vpH - height * zoom) / 2;
    const x = (screenPoint.x - originX) / zoom;
    const y = (screenPoint.y - originY) / zoom;
    return { x, y };
  }

  if (mode === "infinite") {
    // Apply pan (offset) and inverse zoom
    const x = (screenPoint.x - offsetX) / zoom;
    const y = (screenPoint.y - offsetY) / zoom;
    return { x, y };
  }

  // reflow: map container fraction to canvas dimensions
  const fracX = screenPoint.x / vpW;
  const fracY = screenPoint.y / vpH;
  return { x: fracX * width, y: fracY * height };
}

export function canvasToScreen(
  worldPoint: Point,
  canvasConfig: Pick<CanvasState, 'mode' | 'width' | 'height'>,
  viewportState: { width: number; height: number; zoom: number; offsetX: number; offsetY: number }
): Point {
  const { mode, width = 1920, height = 1080 } = canvasConfig;
  const { width: vpW, height: vpH, zoom, offsetX, offsetY } = viewportState;

  if (mode === "fixed") {
    const originX = (vpW - width * zoom) / 2;
    const originY = (vpH - height * zoom) / 2;
    return { x: worldPoint.x * zoom + originX, y: worldPoint.y * zoom + originY };
  }

  if (mode === "infinite") {
    return { x: worldPoint.x * zoom + offsetX, y: worldPoint.y * zoom + offsetY };
  }

  // reflow
  return { x: (worldPoint.x / width) * vpW, y: (worldPoint.y / height) * vpH };
}


