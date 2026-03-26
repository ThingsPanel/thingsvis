import type { CanvasState, KernelState } from '@thingsvis/kernel';

export type PersistedEditorState = Pick<
  KernelState,
  'nodesById' | 'layerOrder' | 'variableDefinitions' | 'canvas'
>;

export function getCanvasPersistenceSignature(canvas: CanvasState): string {
  return JSON.stringify({
    mode: canvas.mode,
    width: canvas.width,
    height: canvas.height,
    gridEnabled: canvas.gridEnabled,
    gridSize: canvas.gridSize,
  });
}

export function hasPersistedEditorStateChange(
  previous: PersistedEditorState,
  current: PersistedEditorState,
): boolean {
  return (
    previous.nodesById !== current.nodesById ||
    previous.layerOrder !== current.layerOrder ||
    previous.variableDefinitions !== current.variableDefinitions ||
    getCanvasPersistenceSignature(previous.canvas) !== getCanvasPersistenceSignature(current.canvas)
  );
}
