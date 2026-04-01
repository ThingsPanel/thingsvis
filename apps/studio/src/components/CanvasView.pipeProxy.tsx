import React from 'react';
import {
  computeIndustrialPipeWorldPolyline,
  type Pt as PipeRoutePoint,
} from '../../../../packages/widgets/industrial/pipe/src/routeWorld';

export type PipeProxySegment = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getPipeProxyHitThickness(strokeWidth?: unknown): number {
  const width = Number(strokeWidth ?? 12);
  const clamped = Number.isFinite(width) ? Math.max(1, Math.min(80, width)) : 12;
  return Math.max(18, clamped + 10);
}

export function buildPipeProxySegments(
  worldPoints: PipeRoutePoint[],
  nodePosition: { x: number; y: number },
  strokeWidth?: unknown,
): PipeProxySegment[] {
  if (!Array.isArray(worldPoints) || worldPoints.length < 2) return [];

  const hitThickness = getPipeProxyHitThickness(strokeWidth);
  const half = hitThickness / 2;
  const segments: PipeProxySegment[] = [];

  for (let index = 1; index < worldPoints.length; index++) {
    const start = worldPoints[index - 1]!;
    const end = worldPoints[index]!;
    const localStart = { x: start.x - nodePosition.x, y: start.y - nodePosition.y };
    const localEnd = { x: end.x - nodePosition.x, y: end.y - nodePosition.y };
    const dx = localEnd.x - localStart.x;
    const dy = localEnd.y - localStart.y;
    const approxHorizontal = Math.abs(dy) <= 2;
    const approxVertical = Math.abs(dx) <= 2;

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

    if (approxHorizontal) {
      const y = (localStart.y + localEnd.y) / 2;
      const left = Math.min(localStart.x, localEnd.x) - half;
      segments.push({
        key: `h-${index}`,
        left,
        top: y - half,
        width: Math.abs(dx) + hitThickness,
        height: hitThickness,
      });
      continue;
    }

    if (approxVertical) {
      const x = (localStart.x + localEnd.x) / 2;
      const top = Math.min(localStart.y, localEnd.y) - half;
      segments.push({
        key: `v-${index}`,
        left: x - half,
        top,
        width: hitThickness,
        height: Math.abs(dy) + hitThickness,
      });
      continue;
    }

    segments.push({
      key: `d-${index}`,
      left: Math.min(localStart.x, localEnd.x) - half,
      top: Math.min(localStart.y, localEnd.y) - half,
      width: Math.abs(dx) + hitThickness,
      height: Math.abs(dy) + hitThickness,
    });
  }

  return segments;
}

export function buildPipeProxySegmentsForNode(
  nodeSchema: Record<string, any>,
  nodesById: Record<string, any>,
  getViewport: () => { zoom: number; offsetX: number; offsetY: number },
  containerEl: HTMLElement | null,
) {
  const position = nodeSchema.position ?? {};
  return buildPipeProxySegments(
    computeIndustrialPipeWorldPolyline(
      { schemaRef: nodeSchema },
      nodesById,
      getViewport,
      containerEl,
    ),
    {
      x: typeof position.x === 'number' ? position.x : 0,
      y: typeof position.y === 'number' ? position.y : 0,
    },
    nodeSchema.props?.strokeWidth,
  );
}

export function PipeProxyHits({
  nodeId,
  segments,
  isPanTool,
  formatBrushActive,
  canvasCursor,
}: {
  nodeId: string;
  segments: PipeProxySegment[];
  isPanTool: boolean;
  formatBrushActive: boolean;
  canvasCursor: string;
}) {
  if (!segments.length) return null;
  return (
    <>
      {segments.map((segment) => (
        <div
          key={segment.key}
          data-node-id={nodeId}
          className="pipe-proxy-hit"
          style={{
            position: 'absolute',
            left: segment.left,
            top: segment.top,
            width: segment.width,
            height: segment.height,
            pointerEvents: isPanTool ? 'none' : 'auto',
            cursor: formatBrushActive ? 'copy' : isPanTool ? canvasCursor : 'move',
            background: 'transparent',
          }}
        />
      ))}
    </>
  );
}
