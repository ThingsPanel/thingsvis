// Internal contracts for zoom-aware transform commits (Studio only).
//
// This is documentation-as-types to keep the integration between CanvasView
// and TransformControls explicit and stable.

export type Viewport = {
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type GetViewport = () => Viewport;

export type ScreenDelta = { dx: number; dy: number };
export type WorldDelta = { dx: number; dy: number };

/**
 * Convert screen-space deltas (CSS pixels) to world-space deltas.
 *
 * Invariant: moving the cursor by N screen pixels moves the node by N screen pixels.
 * Therefore: worldDelta = screenDelta / zoom.
 */
export function screenDeltaToWorldDelta(screen: ScreenDelta, zoom: number): WorldDelta {
  return { dx: screen.dx / zoom, dy: screen.dy / zoom };
}

export type ScreenSize = { width: number; height: number };
export type WorldSize = { width: number; height: number };

/** Convert screen-space size to world-space size. */
export function screenSizeToWorldSize(screen: ScreenSize, zoom: number): WorldSize {
  return { width: screen.width / zoom, height: screen.height / zoom };
}
