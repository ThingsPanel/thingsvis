import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';

type Props = {
  kernelStore: KernelStore;
  containerRef: React.RefObject<HTMLElement>;
  getViewport: () => {
    width: number;
    height: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  onUserEdit?: () => void;
};

type AnchorType = 'top' | 'right' | 'bottom' | 'left' | 'center';

type EndpointDragState = {
  kind: 'endpoint';
  lineId: string;
  endpoint: 'start' | 'end';
  startWorldPos: { x: number; y: number };
  currentWorldPos: { x: number; y: number };
};

type SegmentDragState = {
  kind: 'segment';
  lineId: string;
  segmentIndex: number;
  axis: 'x' | 'y';
  baseWorldPoints: Array<{ x: number; y: number }>;
  startWorldPos: { x: number; y: number };
  currentWorldPos: { x: number; y: number };
};

type DragState = EndpointDragState | SegmentDragState;

type NodeDragPreviewDetail = {
  nodeId: string;
  x: number;
  y: number;
  active: boolean;
};

function isPipeType(type?: string) {
  return type === 'industrial/pipe';
}

function isConnectorType(type?: string) {
  return type === 'basic/line' || type === 'industrial/pipe';
}

function buildElbowRoutePoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
) {
  const sourceHorizontal = sourceAnchor === 'left' || sourceAnchor === 'right';
  const sourceVertical = sourceAnchor === 'top' || sourceAnchor === 'bottom';
  const targetHorizontal = targetAnchor === 'left' || targetAnchor === 'right';
  const targetVertical = targetAnchor === 'top' || targetAnchor === 'bottom';

  if (sourceVertical && targetVertical) {
    const midY = (a.y + b.y) / 2;
    return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
  }
  if (sourceHorizontal && targetHorizontal) {
    const midX = (a.x + b.x) / 2;
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
  }
  if (sourceVertical && targetHorizontal) {
    return [a, { x: a.x, y: b.y }, b];
  }
  if (sourceHorizontal && targetVertical) {
    return [a, { x: b.x, y: a.y }, b];
  }

  const midX = (a.x + b.x) / 2;
  return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b];
}

function isHorizontalSegment(a: { x: number; y: number }, b: { x: number; y: number }, eps = 1) {
  return Math.abs(a.y - b.y) < eps;
}

function isVerticalSegment(a: { x: number; y: number }, b: { x: number; y: number }, eps = 1) {
  return Math.abs(a.x - b.x) < eps;
}

function orthogonalizePipePoints(
  points: Array<{ x: number; y: number }>,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
) {
  if (points.length < 2) return points;

  const result: Array<{ x: number; y: number }> = [points[0]!];

  const chooseElbow = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    prev?: { x: number; y: number },
    next?: { x: number; y: number },
    isFirst?: boolean,
    isLast?: boolean,
  ) => {
    let firstLeg: 'horizontal' | 'vertical' | null = null;

    if (isFirst) {
      if (sourceAnchor === 'left' || sourceAnchor === 'right') firstLeg = 'horizontal';
      if (sourceAnchor === 'top' || sourceAnchor === 'bottom') firstLeg = 'vertical';
    }

    if (!firstLeg && prev) {
      if (isHorizontalSegment(prev, a)) firstLeg = 'vertical';
      else if (isVerticalSegment(prev, a)) firstLeg = 'horizontal';
    }

    if (!firstLeg && next) {
      if (isHorizontalSegment(b, next)) firstLeg = 'horizontal';
      else if (isVerticalSegment(b, next)) firstLeg = 'vertical';
    }

    if (!firstLeg && isLast) {
      if (targetAnchor === 'left' || targetAnchor === 'right') firstLeg = 'vertical';
      if (targetAnchor === 'top' || targetAnchor === 'bottom') firstLeg = 'horizontal';
    }

    if (!firstLeg) {
      firstLeg = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 'horizontal' : 'vertical';
    }

    return firstLeg === 'horizontal' ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  };

  for (let i = 1; i < points.length; i++) {
    const a = result[result.length - 1]!;
    const b = points[i]!;

    if (isHorizontalSegment(a, b) || isVerticalSegment(a, b)) {
      result.push(b);
      continue;
    }

    const prev = result.length >= 2 ? result[result.length - 2] : undefined;
    const next = i < points.length - 1 ? points[i + 1] : undefined;
    const elbow = chooseElbow(a, b, prev, next, i === 1, i === points.length - 1);

    if (Math.abs(elbow.x - a.x) >= 1 || Math.abs(elbow.y - a.y) >= 1) {
      result.push(elbow);
    }
    result.push(b);
  }

  const compacted: Array<{ x: number; y: number }> = [result[0]!];
  for (let i = 1; i < result.length - 1; i++) {
    const prev = compacted[compacted.length - 1]!;
    const curr = result[i]!;
    const next = result[i + 1]!;
    const collinearX = isVerticalSegment(prev, curr) && isVerticalSegment(curr, next);
    const collinearY = isHorizontalSegment(prev, curr) && isHorizontalSegment(curr, next);
    if (collinearX || collinearY) continue;
    compacted.push(curr);
  }
  compacted.push(result[result.length - 1]!);

  if (compacted.length > 4) {
    return buildCanonicalPipeRoute(
      compacted[0]!,
      compacted[compacted.length - 1]!,
      sourceAnchor,
      targetAnchor,
    );
  }

  return compacted;
}

function buildCanonicalPipeRoute(
  start: { x: number; y: number },
  end: { x: number; y: number },
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
) {
  if (isHorizontalSegment(start, end) || isVerticalSegment(start, end)) {
    return [start, end];
  }
  return buildElbowRoutePoints(start, end, sourceAnchor, targetAnchor);
}

const PIPE_STRAIGHT_SNAP_THRESHOLD = 20;

function simplifyPipePoints(
  points: Array<{ x: number; y: number }>,
  sourceAnchor?: AnchorType,
  targetAnchor?: AnchorType,
  collapseThreshold = 12,
) {
  let compacted = orthogonalizePipePoints(points, sourceAnchor, targetAnchor).filter(
    (point, index, arr) =>
      index === 0 ||
      index === arr.length - 1 ||
      Math.abs(point.x - arr[index - 1]!.x) >= 1 ||
      Math.abs(point.y - arr[index - 1]!.y) >= 1,
  );

  if (compacted.length < 2) return compacted;

  let changed = true;
  while (changed && compacted.length >= 4) {
    changed = false;

    for (let i = 0; i <= compacted.length - 4; i++) {
      const a = compacted[i]!;
      const b = compacted[i + 1]!;
      const c = compacted[i + 2]!;
      const d = compacted[i + 3]!;

      const horizontalDogleg =
        isHorizontalSegment(a, b) &&
        isVerticalSegment(b, c) &&
        isHorizontalSegment(c, d) &&
        Math.abs(a.y - d.y) < 1 &&
        Math.abs(b.x - c.x) <= collapseThreshold;

      const verticalDogleg =
        isVerticalSegment(a, b) &&
        isHorizontalSegment(b, c) &&
        isVerticalSegment(c, d) &&
        Math.abs(a.x - d.x) < 1 &&
        Math.abs(b.y - c.y) <= collapseThreshold;

      if (horizontalDogleg || verticalDogleg) {
        compacted = [...compacted.slice(0, i + 1), ...compacted.slice(i + 3)];
        changed = true;
        break;
      }
    }
  }

  if (compacted.length >= 2) {
    const start = compacted[0]!;
    const end = compacted[compacted.length - 1]!;
    if (isHorizontalSegment(start, end) || isVerticalSegment(start, end)) {
      return [start, end];
    }
    if (Math.abs(start.y - end.y) <= PIPE_STRAIGHT_SNAP_THRESHOLD) {
      return [
        start,
        { x: end.x, y: start.y },
      ];
    }
    if (Math.abs(start.x - end.x) <= PIPE_STRAIGHT_SNAP_THRESHOLD) {
      return [
        start,
        { x: start.x, y: end.y },
      ];
    }
  }

  if (compacted.length > 4) {
    return buildCanonicalPipeRoute(
      compacted[0]!,
      compacted[compacted.length - 1]!,
      sourceAnchor,
      targetAnchor,
    );
  }

  return compacted;
}

function getConnectorPadding(strokeWidth?: unknown) {
  const width = Number(strokeWidth ?? 2);
  return Math.max(28, Math.ceil(width * 2 + 16));
}

function normalizeWorldPointsToNode(
  worldPoints: Array<{ x: number; y: number }>,
  padding = getConnectorPadding(),
) {
  const minX = Math.min(...worldPoints.map((point) => point.x));
  const minY = Math.min(...worldPoints.map((point) => point.y));
  const maxX = Math.max(...worldPoints.map((point) => point.x));
  const maxY = Math.max(...worldPoints.map((point) => point.y));

  const position = { x: minX - padding, y: minY - padding };
  const size = {
    width: Math.max(40, maxX - minX + padding * 2),
    height: Math.max(40, maxY - minY + padding * 2),
  };
  const points = worldPoints.map((point) => ({
    x: point.x - position.x,
    y: point.y - position.y,
  }));

  return { position, size, points };
}

export default function LineConnectionTool({
  kernelStore,
  containerRef,
  getViewport,
  onUserEdit,
}: Props) {
  const state = useSyncExternalStore(
    useCallback((cb) => kernelStore.subscribe(cb), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPreviewById, setDragPreviewById] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<AnchorType | null>(null);
  const endpointsRef = useRef<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);

  const selectedLineIds = state.selection.nodeIds.filter((id) => {
    const node = state.nodesById[id];
    return isConnectorType(node?.schemaRef?.type);
  });
  const selectedLineId = selectedLineIds.length === 1 ? selectedLineIds[0] : null;
  const selectedLine = selectedLineId ? state.nodesById[selectedLineId] : null;
  const selectedType = (selectedLine?.schemaRef as any)?.type as string | undefined;
  const isSelectedPipe = isPipeType(selectedType);

  useEffect(() => {
    const handleDragPreview = (event: Event) => {
      const detail = (event as CustomEvent<NodeDragPreviewDetail>).detail;
      if (!detail?.nodeId) return;

      setDragPreviewById((prev) => {
        if (!detail.active) {
          if (!(detail.nodeId in prev)) return prev;
          const next = { ...prev };
          delete next[detail.nodeId];
          return next;
        }

        const current = prev[detail.nodeId];
        if (current && current.x === detail.x && current.y === detail.y) return prev;
        return {
          ...prev,
          [detail.nodeId]: { x: detail.x, y: detail.y },
        };
      });
    };

    window.addEventListener('thingsvis:node-drag-preview', handleDragPreview as EventListener);
    return () => {
      window.removeEventListener('thingsvis:node-drag-preview', handleDragPreview as EventListener);
    };
  }, []);

  const getPreviewTranslate = useCallback(
    (nodeId?: string | null) => {
      if (!nodeId) return { x: 0, y: 0 };
      return dragPreviewById[nodeId] ?? { x: 0, y: 0 };
    },
    [dragPreviewById],
  );

  const getAnchorWorldPosition = useCallback(
    (schema: any, anchor: AnchorType): { x: number; y: number } => {
      const pos = schema.position || { x: 0, y: 0 };
      const size = schema.size || { width: 100, height: 100 };
      const cx = pos.x + size.width / 2;
      const cy = pos.y + size.height / 2;

      switch (anchor) {
        case 'top':
          return { x: cx, y: pos.y };
        case 'right':
          return { x: pos.x + size.width, y: cy };
        case 'bottom':
          return { x: cx, y: pos.y + size.height };
        case 'left':
          return { x: pos.x, y: cy };
        case 'center':
        default:
          return { x: cx, y: cy };
      }
    },
    [],
  );

  const getRouteWorldPoints = useCallback(() => {
    if (!selectedLine) return null;

    const schema = selectedLine.schemaRef as any;
    const preview = getPreviewTranslate(selectedLineId);
    const basePos = schema.position || { x: 0, y: 0 };
    const pos = { x: basePos.x + preview.x, y: basePos.y + preview.y };
    const size = schema.size || { width: 200, height: 40 };
    const props = schema.props || {};
    const rawPoints = Array.isArray(props.points) ? props.points : null;
    const normalized =
      !!rawPoints &&
      rawPoints.every((p: any) => typeof p?.x === 'number' && typeof p?.y === 'number') &&
      Math.max(...rawPoints.map((p: any) => Math.max(p.x, p.y))) <= 1;

    const localToWorld = (point: any) => {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return null;
      return {
        x: pos.x + (normalized ? point.x * size.width : point.x),
        y: pos.y + (normalized ? point.y * size.height : point.y),
      };
    };

    const resolveBound = (nodeId?: string, anchor?: AnchorType) => {
      if (!nodeId) return null;
      const boundNode = state.nodesById[nodeId];
      if (!boundNode) return null;
      return getAnchorWorldPosition(boundNode.schemaRef as any, (anchor || 'center') as AnchorType);
    };

    const firstPoint = rawPoints && rawPoints.length > 0 ? rawPoints[0] : null;
    const lastPoint = rawPoints && rawPoints.length > 0 ? rawPoints[rawPoints.length - 1] : null;
    const start = resolveBound(props.sourceNodeId, props.sourceAnchor) ??
      localToWorld(firstPoint) ?? { x: pos.x, y: pos.y + size.height / 2 };
    const end = resolveBound(props.targetNodeId, props.targetAnchor) ??
      localToWorld(lastPoint) ?? { x: pos.x + size.width, y: pos.y + size.height / 2 };

    if (isPipeType(schema.type)) {
      if (rawPoints && rawPoints.length >= 3) {
        return simplifyPipePoints(
          rawPoints
            .map((point, index) => {
              if (index === 0) return start;
              if (index === rawPoints.length - 1) return end;
              return localToWorld(point);
            })
            .filter(Boolean) as Array<{ x: number; y: number }>,
          props.sourceAnchor,
          props.targetAnchor,
        );
      }
      return buildElbowRoutePoints(start, end, props.sourceAnchor, props.targetAnchor);
    }

    return [start, end];
  }, [getAnchorWorldPosition, getPreviewTranslate, selectedLine, selectedLineId, state.nodesById]);

  useEffect(() => {
    if (!selectedLineId || !selectedLine || dragState || !isSelectedPipe) return;

    const schema = selectedLine.schemaRef as any;
    const currentProps = schema?.props || {};
    const rawPoints = Array.isArray(currentProps.points) ? currentProps.points : null;
    if (!rawPoints || rawPoints.length < 3) return;

    const worldPoints = getRouteWorldPoints();
    if (!worldPoints || worldPoints.length < 2) return;

    const normalized = normalizeWorldPointsToNode(
      worldPoints,
      getConnectorPadding(currentProps.strokeWidth),
    );
    const samePosition =
      schema.position?.x === normalized.position.x && schema.position?.y === normalized.position.y;
    const sameSize =
      schema.size?.width === normalized.size.width && schema.size?.height === normalized.size.height;
    const samePoints =
      JSON.stringify(currentProps.points) === JSON.stringify(normalized.points);

    if (samePosition && sameSize && samePoints) return;

    const updateNode = (kernelStore.getState() as any).updateNode;
    if (!updateNode) return;

    updateNode(selectedLineId, {
      props: { ...currentProps, points: normalized.points },
      position: normalized.position,
      size: normalized.size,
    });
  }, [dragState, getRouteWorldPoints, isSelectedPipe, kernelStore, selectedLine, selectedLineId]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      if (!container) return { x: screenX, y: screenY };

      const rect = container.getBoundingClientRect();
      const vp = getViewport();
      return {
        x: (screenX - rect.left - vp.offsetX) / vp.zoom,
        y: (screenY - rect.top - vp.offsetY) / vp.zoom,
      };
    },
    [containerRef, getViewport],
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      const container = containerRef.current;
      if (!container) return { x: worldX, y: worldY };

      const rect = container.getBoundingClientRect();
      const vp = getViewport();
      return {
        x: worldX * vp.zoom + vp.offsetX + rect.left,
        y: worldY * vp.zoom + vp.offsetY + rect.top,
      };
    },
    [containerRef, getViewport],
  );

  const detectNodeAndAnchor = useCallback(
    (worldPos: { x: number; y: number }) => {
      const nodes = Object.values(state.nodesById);
      for (const node of nodes) {
        if (node.id === selectedLineId) continue;
        if (isConnectorType(node.schemaRef?.type)) continue;
        if (!node.visible) continue;

        const schema = node.schemaRef as any;
        const pos = schema.position || { x: 0, y: 0 };
        const size = schema.size || { width: 100, height: 100 };
        const padding = 30;

        if (
          worldPos.x >= pos.x - padding &&
          worldPos.x <= pos.x + size.width + padding &&
          worldPos.y >= pos.y - padding &&
          worldPos.y <= pos.y + size.height + padding
        ) {
          const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
          let closestAnchor: AnchorType = 'center';
          let closestDist = Infinity;

          for (const anchor of anchors) {
            const anchorPos = getAnchorWorldPosition(schema, anchor);
            const dist = Math.hypot(worldPos.x - anchorPos.x, worldPos.y - anchorPos.y);
            if (dist < closestDist) {
              closestDist = dist;
              closestAnchor = anchor;
            }
          }

          return { nodeId: node.id, anchor: closestAnchor };
        }
      }

      return null;
    },
    [getAnchorWorldPosition, selectedLineId, state.nodesById],
  );

  const getDraggedSegmentPoints = useCallback((segmentState: SegmentDragState) => {
    const deltaX = segmentState.currentWorldPos.x - segmentState.startWorldPos.x;
    const deltaY = segmentState.currentWorldPos.y - segmentState.startWorldPos.y;
    const nextPoints = segmentState.baseWorldPoints.map((point) => ({ ...point }));
    const first = nextPoints[segmentState.segmentIndex];
    const second = nextPoints[segmentState.segmentIndex + 1];
    if (!first || !second) return nextPoints;

    if (segmentState.axis === 'x') {
      first.x += deltaX;
      second.x += deltaX;
    } else {
      first.y += deltaY;
      second.y += deltaY;
    }

    return nextPoints;
  }, []);

  const handleHandleMouseDown = useCallback(
    (endpoint: 'start' | 'end', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedLineId) return;

      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState({
        kind: 'endpoint',
        lineId: selectedLineId,
        endpoint,
        startWorldPos: worldPos,
        currentWorldPos: worldPos,
      });
    },
    [screenToWorld, selectedLineId],
  );

  const handleSegmentMouseDown = useCallback(
    (
      segmentIndex: number,
      axis: 'x' | 'y',
      baseWorldPoints: Array<{ x: number; y: number }>,
      e: React.MouseEvent,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedLineId) return;

      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState({
        kind: 'segment',
        lineId: selectedLineId,
        segmentIndex,
        axis,
        baseWorldPoints,
        startWorldPos: worldPos,
        currentWorldPos: worldPos,
      });
    },
    [screenToWorld, selectedLineId],
  );

  const handleHandleDoubleClick = useCallback(
    (endpoint: 'start' | 'end', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedLineId) return;

      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const node = state.nodesById[selectedLineId];
      const currentProps = (node?.schemaRef as any)?.props || {};
      const propKey = endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
      const anchorKey = endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';

      if (currentProps[propKey]) {
        const newProps = { ...currentProps };
        delete newProps[propKey];
        delete newProps[anchorKey];
        updateNode(selectedLineId, { props: newProps });
        onUserEdit?.();
      }
    },
    [kernelStore, onUserEdit, selectedLineId, state.nodesById],
  );

  const resetPipeRoute = useCallback(() => {
    if (!selectedLineId || !selectedLine || !isSelectedPipe) return;

    const currentState = kernelStore.getState() as any;
    const updateNode = currentState.updateNode;
    if (!updateNode) return;

    const currentProps = (selectedLine.schemaRef as any)?.props || {};
    const worldPoints = getRouteWorldPoints();
    if (!worldPoints || worldPoints.length < 2) return;

    const canonical = buildCanonicalPipeRoute(
      worldPoints[0]!,
      worldPoints[worldPoints.length - 1]!,
      currentProps.sourceAnchor,
      currentProps.targetAnchor,
    );
    const normalized = normalizeWorldPointsToNode(
      canonical,
      getConnectorPadding(currentProps.strokeWidth),
    );

    updateNode(selectedLineId, {
      props: { ...currentProps, points: normalized.points },
      position: normalized.position,
      size: normalized.size,
    });
    onUserEdit?.();
  }, [getRouteWorldPoints, isSelectedPipe, kernelStore, onUserEdit, selectedLine, selectedLineId]);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState((prev) => (prev ? { ...prev, currentWorldPos: worldPos } : null));

      if (dragState.kind === 'endpoint') {
        const detected = detectNodeAndAnchor(worldPos);
        if (detected) {
          setHoveredNodeId(detected.nodeId);
          setHoveredAnchor(detected.anchor);
        } else {
          setHoveredNodeId(null);
          setHoveredAnchor(null);
        }
      }
    };

    const handleMouseUp = () => {
      const currentState = kernelStore.getState() as any;
      const updateNode = currentState.updateNode;
      if (!updateNode) return;

      const lineNode = state.nodesById[dragState.lineId];
      const lineSchema = lineNode?.schemaRef as any;
      const currentProps = lineSchema?.props || {};

      if (dragState.kind === 'segment') {
        const worldPoints = simplifyPipePoints(
          getDraggedSegmentPoints(dragState),
          currentProps.sourceAnchor,
          currentProps.targetAnchor,
        );
        const normalized = normalizeWorldPointsToNode(
          worldPoints,
          getConnectorPadding(currentProps.strokeWidth),
        );
        updateNode(dragState.lineId, {
          props: { ...currentProps, points: normalized.points },
          position: normalized.position,
          size: normalized.size,
        });
        onUserEdit?.();
      } else {
        const propKey = dragState.endpoint === 'start' ? 'sourceNodeId' : 'targetNodeId';
        const anchorKey = dragState.endpoint === 'start' ? 'sourceAnchor' : 'targetAnchor';
        const nextProps: any = { ...currentProps };

        if (hoveredNodeId && hoveredAnchor) {
          nextProps[propKey] = hoveredNodeId;
          nextProps[anchorKey] = hoveredAnchor;
        } else {
          delete nextProps[propKey];
          delete nextProps[anchorKey];
        }

        const latest = endpointsRef.current;
        if (latest) {
          const otherEndpoint = dragState.endpoint === 'start' ? latest.end : latest.start;
          const dragged =
            hoveredNodeId && hoveredAnchor && state.nodesById[hoveredNodeId]
              ? getAnchorWorldPosition(
                  (state.nodesById[hoveredNodeId].schemaRef as any) || {},
                  hoveredAnchor,
                )
              : dragState.currentWorldPos;

          if (isPipeType(lineSchema?.type)) {
            const existingWorldPoints = getRouteWorldPoints() ?? [latest.start, latest.end];
            const nextWorldPoints =
              existingWorldPoints.length >= 3
                ? existingWorldPoints.map((point) => ({ ...point }))
                : buildElbowRoutePoints(
                    dragState.endpoint === 'start' ? dragged : otherEndpoint,
                    dragState.endpoint === 'start' ? otherEndpoint : dragged,
                    nextProps.sourceAnchor,
                    nextProps.targetAnchor,
                  );

            if (dragState.endpoint === 'start') {
              nextWorldPoints[0] = dragged;
            } else {
              nextWorldPoints[nextWorldPoints.length - 1] = dragged;
            }

            const normalized = normalizeWorldPointsToNode(
              simplifyPipePoints(nextWorldPoints, nextProps.sourceAnchor, nextProps.targetAnchor),
              getConnectorPadding(currentProps.strokeWidth),
            );
            updateNode(dragState.lineId, {
              props: { ...nextProps, points: normalized.points },
              position: normalized.position,
              size: normalized.size,
            });
          } else {
            const normalized = normalizeWorldPointsToNode(
              [
                dragState.endpoint === 'start' ? dragged : otherEndpoint,
                dragState.endpoint === 'start' ? otherEndpoint : dragged,
              ],
              getConnectorPadding(currentProps.strokeWidth),
            );
            updateNode(dragState.lineId, {
              props: { ...nextProps, points: normalized.points },
              position: normalized.position,
              size: normalized.size,
            });
          }
          onUserEdit?.();
        } else {
          updateNode(dragState.lineId, { props: nextProps });
          onUserEdit?.();
        }
      }

      setDragState(null);
      setHoveredNodeId(null);
      setHoveredAnchor(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    detectNodeAndAnchor,
    dragState,
    getAnchorWorldPosition,
    getDraggedSegmentPoints,
    getRouteWorldPoints,
    hoveredAnchor,
    hoveredNodeId,
    kernelStore,
    onUserEdit,
    screenToWorld,
    state.nodesById,
  ]);

  const routePoints = useMemo(() => {
    if (!selectedLine) return null;
    if (dragState?.kind === 'segment') {
      return getDraggedSegmentPoints(dragState);
    }
    return getRouteWorldPoints();
  }, [dragState, getDraggedSegmentPoints, getRouteWorldPoints, selectedLine]);

  if (!selectedLineId || !selectedLine || !routePoints || routePoints.length < 2) {
    return null;
  }

  const endpoints = {
    start: routePoints[0]!,
    end: routePoints[routePoints.length - 1]!,
  };
  endpointsRef.current = endpoints;
  const handleSize = 14;
  const selectedProps = (selectedLine.schemaRef as any)?.props || {};

  const isEndpointConnected = (endpoint: 'start' | 'end') =>
    endpoint === 'start' ? !!selectedProps.sourceNodeId : !!selectedProps.targetNodeId;

  const renderHandle = (worldPos: { x: number; y: number }, endpoint: 'start' | 'end') => {
    const isDragging = dragState?.kind === 'endpoint' && dragState.endpoint === endpoint;
    const isConnected = isEndpointConnected(endpoint);
    const displayWorldPos = isDragging ? dragState.currentWorldPos : worldPos;
    const screenPos = worldToScreen(displayWorldPos.x, displayWorldPos.y);
    const borderColor = isConnected ? 'border-green-500' : 'border-[#6965db]';
    const hoverBg = isConnected ? 'hover:bg-green-500/20' : 'hover:bg-[#6965db]/20';

    return (
      <div
        key={endpoint}
        className={`absolute rounded-full border-2 cursor-grab transition-all duration-75 ${
          isDragging
            ? 'bg-blue-500 border-blue-600 scale-125 shadow-lg'
            : `bg-white ${borderColor} ${hoverBg} hover:scale-110`
        }`}
        style={{
          left: screenPos.x - handleSize / 2,
          top: screenPos.y - handleSize / 2,
          width: handleSize,
          height: handleSize,
          zIndex: 1000,
        }}
        onMouseDown={(e) => handleHandleMouseDown(endpoint, e)}
        onDoubleClick={(e) => handleHandleDoubleClick(endpoint, e)}
        title={isConnected ? '双击断开连接' : '拖动连接到其他组件'}
      />
    );
  };

  const renderDragLine = () => {
    if (!dragState || dragState.kind !== 'endpoint') return null;
    const otherEndpoint = dragState.endpoint === 'start' ? endpoints.end : endpoints.start;
    const startScreenPos = worldToScreen(otherEndpoint.x, otherEndpoint.y);
    const endScreenPos = worldToScreen(dragState.currentWorldPos.x, dragState.currentWorldPos.y);

    return (
      <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 999 }}>
        <line
          x1={startScreenPos.x}
          y1={startScreenPos.y}
          x2={endScreenPos.x}
          y2={endScreenPos.y}
          stroke="#6965db"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      </svg>
    );
  };

  /* const renderMoveSurface = () => {
    if (!isSelectedPipe) return null;

    const props = selectedProps || {};
    if (props.sourceNodeId || props.targetNodeId) return null;

    const schema = selectedLine.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 0, height: 0 };
    const topLeft = worldToScreen(pos.x, pos.y);
    const bottomRight = worldToScreen(pos.x + size.width, pos.y + size.height);
    const isDragging = dragState?.kind === 'move';
    const left = topLeft.x;
    const top = topLeft.y;
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    return (
      <div
        className="absolute"
        style={{
          left: topLeft.x,
          top: topLeft.y,
          width: bottomRight.x - topLeft.x,
          height: bottomRight.y - topLeft.y,
          zIndex: 997,
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'transparent',
        }}
        title="拖动移动整条管道"
      />
    );
  };

  const renderMoveHint = () => {
    if (!isSelectedPipe) return null;

    const props = selectedProps || {};
    if (props.sourceNodeId || props.targetNodeId) return null;

    const schema = selectedLine.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 0, height: 0 };
    const topLeft = worldToScreen(pos.x, pos.y);
    const bottomRight = worldToScreen(pos.x + size.width, pos.y + size.height);
    const isDragging = dragState?.kind === 'move';
    const left = topLeft.x;
    const top = topLeft.y;
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    return (
      <>
        <div
          className="absolute rounded-md border border-dashed pointer-events-none"
          style={{
            left,
            top,
            width,
            height,
            zIndex: 996,
            borderColor: isDragging ? '#2563eb' : 'rgba(37,99,235,0.45)',
            background: isDragging ? 'rgba(37,99,235,0.06)' : 'transparent',
          }}
        />
        <div
          className="absolute rounded-md border px-2 py-1 text-[11px] font-medium select-none pointer-events-none"
          style={{
            left: left + width / 2,
            top: top - 12,
            transform: 'translate(-50%, -100%)',
            zIndex: 998,
            color: '#1d4ed8',
            borderColor: isDragging ? '#2563eb' : 'rgba(37,99,235,0.35)',
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 1px 4px rgba(37,99,235,0.12)',
          }}
        >
          拖动整条管道
        </div>
      </>
    );
  };

  */
  const renderHoveredAnchors = () => {
    if (dragState?.kind !== 'endpoint' || !hoveredNodeId) return null;
    const node = state.nodesById[hoveredNodeId];
    if (!node) return null;

    const schema = node.schemaRef as any;
    const anchors: AnchorType[] = ['top', 'right', 'bottom', 'left', 'center'];
    return anchors.map((anchor) => {
      const anchorPos = getAnchorWorldPosition(schema, anchor);
      const screenPos = worldToScreen(anchorPos.x, anchorPos.y);
      const isActive = anchor === hoveredAnchor;
      const anchorSize = isActive ? 16 : 10;

      return (
        <div
          key={anchor}
          className={`absolute rounded-full border-2 pointer-events-none transition-all duration-100 ${
            isActive ? 'bg-green-500 border-green-600 shadow-lg' : 'bg-white border-gray-400'
          }`}
          style={{
            left: screenPos.x - anchorSize / 2,
            top: screenPos.y - anchorSize / 2,
            width: anchorSize,
            height: anchorSize,
            zIndex: 1001,
          }}
        />
      );
    });
  };

  const renderNodeHighlight = () => {
    if (dragState?.kind !== 'endpoint' || !hoveredNodeId) return null;
    const node = state.nodesById[hoveredNodeId];
    if (!node) return null;

    const schema = node.schemaRef as any;
    const pos = schema.position || { x: 0, y: 0 };
    const size = schema.size || { width: 100, height: 100 };
    const topLeft = worldToScreen(pos.x, pos.y);
    const bottomRight = worldToScreen(pos.x + size.width, pos.y + size.height);

    return (
      <div
        className="absolute border-2 border-green-500 border-dashed pointer-events-none"
        style={{
          left: topLeft.x,
          top: topLeft.y,
          width: bottomRight.x - topLeft.x,
          height: bottomRight.y - topLeft.y,
          zIndex: 998,
          borderRadius: 4,
        }}
      />
    );
  };

  const renderSegmentHandles = () => {
    if (!isSelectedPipe || routePoints.length < 2) return null;

    return routePoints.slice(0, -1).map((point, index) => {
      const next = routePoints[index + 1]!;
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const axis: 'x' | 'y' = horizontal ? 'y' : 'x';
      const isEdgeSegment = index === 0 || index === routePoints.length - 2;
      if (
        (index === 0 && selectedProps.sourceNodeId) ||
        (index === routePoints.length - 2 && selectedProps.targetNodeId)
      ) {
        return null;
      }
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;

      const mid = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
      const screenPos = worldToScreen(mid.x, mid.y);
      const isDragging = dragState?.kind === 'segment' && dragState.segmentIndex === index;

      return (
        <div
          key={`segment-${index}`}
          className={`absolute rounded border transition-all duration-75 ${
            isDragging
              ? 'bg-orange-500 border-orange-600 shadow-lg'
              : 'bg-white/90 border-orange-400 hover:bg-orange-50'
          }`}
          style={{
            left: screenPos.x - 9,
            top: screenPos.y - 9,
            width: 18,
            height: 18,
            zIndex: isEdgeSegment ? 998 : 999,
            cursor: axis === 'x' ? 'col-resize' : 'row-resize',
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => {
            if (e.detail >= 2) {
              e.preventDefault();
              e.stopPropagation();
              resetPipeRoute();
              return;
            }
            handleSegmentMouseDown(index, axis, routePoints, e);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            resetPipeRoute();
          }}
          title={
            axis === 'x'
              ? '拖动调整竖向管段，双击恢复标准路由'
              : '拖动调整横向管段，双击恢复标准路由'
          }
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 998 }}>
      {renderNodeHighlight()}
      <div className="pointer-events-auto">
        {renderHandle(endpoints.start, 'start')}
        {renderHandle(endpoints.end, 'end')}
        {renderSegmentHandles()}
      </div>
      {renderDragLine()}
      {renderHoveredAnchors()}
    </div>
  );
}
