export function snapToGrid(value: number, gridSize: number) {
  if (!gridSize || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(point: { x: number; y: number }, gridSize: number) {
  return { x: snapToGrid(point.x, gridSize), y: snapToGrid(point.y, gridSize) };
}

export default { snapToGrid, snapPointToGrid };


