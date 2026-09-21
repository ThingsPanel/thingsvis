export type DropPoint = { x: number; y: number };
export type DropSize = { width?: number; height?: number };

export function clampNodePositionToCanvas(
  point: DropPoint,
  size: DropSize,
  canvas: { width: number; height: number },
): DropPoint {
  const width = Math.max(0, Number(size.width) || 0);
  const height = Math.max(0, Number(size.height) || 0);
  return {
    x: Math.max(0, Math.min(Math.max(0, canvas.width - width), point.x)),
    y: Math.max(0, Math.min(Math.max(0, canvas.height - height), point.y)),
  };
}

export function clampDropPointToCanvas(
  point: DropPoint,
  nodes: Array<{ position?: DropPoint; size?: DropSize }>,
  canvas: { width: number; height: number },
): DropPoint {
  const validNodes = nodes.filter(
    (node) => Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y),
  );
  if (validNodes.length === 0) return clampNodePositionToCanvas(point, {}, canvas);

  const minX = Math.min(...validNodes.map((node) => node.position!.x));
  const minY = Math.min(...validNodes.map((node) => node.position!.y));
  const maxX = Math.max(
    ...validNodes.map((node) => node.position!.x + Math.max(0, Number(node.size?.width) || 0)),
  );
  const maxY = Math.max(
    ...validNodes.map((node) => node.position!.y + Math.max(0, Number(node.size?.height) || 0)),
  );
  const groupWidth = Math.max(0, maxX - minX);
  const groupHeight = Math.max(0, maxY - minY);

  return {
    x: Math.max(0, Math.min(Math.max(0, canvas.width - groupWidth), point.x)),
    y: Math.max(0, Math.min(Math.max(0, canvas.height - groupHeight), point.y)),
  };
}
