/**
 * Moveable Adapter
 * Minimal adapter wrapper to integrate Moveable library with host apps.
 * This file intentionally provides a headless API: it does not import Moveable directly
 * to avoid bundling issues in packages; apps should import real Moveable and adapt when integrating.
 */
export type MoveableEvent = {
  target: HTMLElement;
  deltaX?: number;
  deltaY?: number;
  beforeDist?: number;
  beforeRotate?: number;
};

export function attachMoveable(target: HTMLElement, options: any, handlers: { onDrag?: (e: MoveableEvent) => void; onDragEnd?: (e: MoveableEvent) => void }) {
  // noop placeholder; real integration happens in apps/studio using Moveable package.
  // This adapter exists so packages/thingsvis-ui can export a consistent API surface.
  return {
    destroy() {
      // no-op
    }
  };
}

export default { attachMoveable };


