import { createStore, type StoreApi } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type { PageSchemaType, NodeSchemaType, IPage } from '@thingsvis/schema';

export type SelectionState = {
  nodeIds: string[];
};

export type CanvasState = {
  mode: 'fixed' | 'infinite' | 'reflow';
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type NodeState = {
  id: string;
  schemaRef: NodeSchemaType;
  visible: boolean;
  locked: boolean;
  runtimeData?: Record<string, unknown>;
  error?: string;
};

export type ConnectionState = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceAnchor?: string;
  targetAnchor?: string;
  props?: Record<string, unknown>;
};

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

function nodeRect(node: NodeState): Rect {
  const schema = node.schemaRef as any;
  const pos = schema.position ?? { x: 0, y: 0 };
  const size = schema.size ?? { width: 0, height: 0 };
  return {
    x: pos.x ?? 0,
    y: pos.y ?? 0,
    width: size.width ?? 0,
    height: size.height ?? 0
  };
}

function rectCenter(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function normalize(v: Point): Point {
  const d = Math.hypot(v.x, v.y);
  if (d <= 0) return { x: 1, y: 0 };
  return { x: v.x / d, y: v.y / d };
}

function borderPointFromCenter(rect: Rect, toward: Point): Point {
  // Compute intersection of ray from rect center toward `toward` with rect border.
  const c = rectCenter(rect);
  const d = { x: toward.x - c.x, y: toward.y - c.y };
  const dx = d.x;
  const dy = d.y;
  const hw = rect.width / 2;
  const hh = rect.height / 2;

  // If size is zero, treat as a point.
  if (hw <= 0 && hh <= 0) return c;

  // Scale factor to reach the border in the ray direction.
  const tx = Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const ty = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Number.POSITIVE_INFINITY;
  const t = Math.min(tx, ty);
  if (!Number.isFinite(t)) return c;
  return { x: c.x + dx * t, y: c.y + dy * t };
}

function pathLength(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

function buildDefaultManhattanPolyline(source: NodeState, target: NodeState): Point[] {
  const sr = nodeRect(source);
  const tr = nodeRect(target);
  const sCenter = rectCenter(sr);
  const tCenter = rectCenter(tr);

  const dirST = normalize({ x: tCenter.x - sCenter.x, y: tCenter.y - sCenter.y });
  const dirTS = normalize({ x: sCenter.x - tCenter.x, y: sCenter.y - tCenter.y });

  const margin = 16;
  const sBorder = borderPointFromCenter(sr, tCenter);
  const tBorder = borderPointFromCenter(tr, sCenter);
  const sExit = { x: sBorder.x + dirST.x * margin, y: sBorder.y + dirST.y * margin };
  const tEntry = { x: tBorder.x + dirTS.x * margin, y: tBorder.y + dirTS.y * margin };

  const dx = Math.abs(tCenter.x - sCenter.x);
  const dy = Math.abs(tCenter.y - sCenter.y);
  if (dx < 4 || dy < 4) {
    // Almost aligned: keep it simple.
    return [sCenter, tCenter];
  }

  // Two candidates: horizontal-then-vertical (HV) or vertical-then-horizontal (VH)
  const bendHV: Point = { x: tEntry.x, y: sExit.y };
  const bendVH: Point = { x: sExit.x, y: tEntry.y };

  const hv = [sCenter, sExit, bendHV, tEntry, tCenter];
  const vh = [sCenter, sExit, bendVH, tEntry, tCenter];

  // Choose the shorter route by default (competitor-like behavior when no obstacles)
  return pathLength(hv) <= pathLength(vh) ? hv : vh;
}

export type DataSourceRuntimeState = {
  id: string;
  data: any;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  error?: string;
  lastUpdated: number;
};

export type LayerGroup = {
  id: string;
  name: string;
  expanded: boolean;
  locked: boolean;
  visible: boolean;
  memberIds: string[];
};

export type KernelState = {
  page?: IPage | PageSchemaType;
  nodesById: Record<string, NodeState>;
  connections: ConnectionState[];
  selection: SelectionState;
  canvas: CanvasState;
  dataSources: Record<string, DataSourceRuntimeState>;
  // Layer system
  layerOrder: string[]; // node ids in render order (bottom to top)
  layerGroups: Record<string, LayerGroup>;
};

export type KernelActions = {
  loadPage: (page: IPage | PageSchemaType) => void;
  addNodes: (nodes: NodeSchemaType[]) => void;
  removeNodes: (nodeIds: string[]) => void;
  selectNode: (nodeId: string | null) => void;
  selectNodes: (nodeIds: string[]) => void;
  toggleNodeSelection: (nodeId: string) => void;
  updateNode: (
    nodeId: string,
    changes: {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      props?: Record<string, unknown>;
      locked?: boolean;
      data?: any[]; // 新增：支持数据绑定字段更新
    }
  ) => void;
  setNodeError: (nodeId: string, error: string) => void;
  addConnection: (conn: Omit<ConnectionState, 'id'>) => void;
  removeConnection: (connId: string) => void;
  updateCanvas: (changes: Partial<CanvasState>) => void;
  
  // Data Source Actions
  setDataSourceState: (id: string, state: Partial<DataSourceRuntimeState>) => void;
  updateDataSourceData: (id: string, data: any) => void;

  // Layer Actions
  setNodeVisible: (nodeId: string, visible: boolean) => void;
  setNodeLocked: (nodeId: string, locked: boolean) => void;
  renameNode: (nodeId: string, name: string) => void;
  reorderLayers: (nodeId: string, targetIndex: number) => void;
  bringToFront: (nodeIds: string[]) => void;
  sendToBack: (nodeIds: string[]) => void;
  bringForward: (nodeIds: string[]) => void;
  sendBackward: (nodeIds: string[]) => void;
  
  // Group Actions
  createGroup: (nodeIds: string[], groupName?: string) => string;
  ungroup: (groupId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  setGroupVisible: (groupId: string, visible: boolean) => void;
  setGroupLocked: (groupId: string, locked: boolean) => void;
  renameGroup: (groupId: string, name: string) => void;
};

export type KernelStoreState = KernelState & KernelActions;

export type KernelStore = StoreApi<KernelStoreState> & {
  // zundo's temporal middleware augments the store API at runtime.
  // We keep this loosely typed to avoid coupling to zundo internals.
  temporal: any;
};

const defaultCanvas: CanvasState = { 
  mode: 'infinite',
  width: 1920,
  height: 1080,
  zoom: 1, 
  offsetX: 0, 
  offsetY: 0 
};

export const createKernelStore = () =>
  (createStore<KernelStoreState>()(
    (temporal as any)(
      immer<KernelState & KernelActions>((set, get) => ({
      page: undefined,
      nodesById: {},
      connections: [],
      selection: { nodeIds: [] },
      canvas: defaultCanvas,
      dataSources: {},
      layerOrder: [],
      layerGroups: {},

      loadPage: page => {
        const nodesById: Record<string, NodeState> = {};
        const nodes = 'content' in page ? page.content.nodes : (page as any).nodes || [];
        
        nodes.forEach((node: NodeSchemaType) => {
          nodesById[node.id] = {
            id: node.id,
            schemaRef: node,
            visible: true,
            locked: false
          };
        });

        const config = 'config' in page ? page.config : (page as any).config || {};

        set(state => {
          state.page = page;
          state.nodesById = nodesById;
          state.connections = (page as any).connections || [];
          state.selection = { nodeIds: [] };
          state.canvas = { 
            ...defaultCanvas,
            mode: config.mode || (page as any).mode || 'infinite',
            width: config.width || (page as any).width || 1920,
            height: config.height || (page as any).height || 1080,
          };
          // Initialize layer order from nodes
          state.layerOrder = nodes.map((n: NodeSchemaType) => n.id);
          state.layerGroups = {};
        });
      },

      addNodes: nodes => {
        set(state => {
          nodes.forEach(node => {
            const existing = state.nodesById[node.id];
            state.nodesById[node.id] = {
              id: node.id,
              schemaRef: node,
              visible: existing?.visible ?? true,
              locked: existing?.locked ?? false,
              runtimeData: existing?.runtimeData,
              error: undefined
            };
            // Add to layer order if new
            if (!state.layerOrder.includes(node.id)) {
              state.layerOrder.push(node.id);
            }
          });
        });
      },

      removeNodes: nodeIds => {
        set(state => {
          nodeIds.forEach(nodeId => {
            delete state.nodesById[nodeId];
            state.layerOrder = state.layerOrder.filter(id => id !== nodeId);
            // Remove from any group
            Object.values(state.layerGroups).forEach(group => {
              group.memberIds = group.memberIds.filter(id => id !== nodeId);
            });
          });
          // Clear selection if removed
          state.selection.nodeIds = state.selection.nodeIds.filter(id => !nodeIds.includes(id));
        });
      },

      selectNode: nodeId => {
        if (nodeId && !get().nodesById[nodeId]) return;
        set(state => {
          state.selection = { nodeIds: nodeId ? [nodeId] : [] };
        });
      },

      selectNodes: nodeIds => {
        const validIds = nodeIds.filter(id => get().nodesById[id]);
        set(state => {
          state.selection = { nodeIds: validIds };
        });
      },

      toggleNodeSelection: nodeId => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          const currentIds = state.selection.nodeIds;
          if (currentIds.includes(nodeId)) {
            // Remove from selection
            state.selection.nodeIds = currentIds.filter(id => id !== nodeId);
          } else {
            // Add to selection
            state.selection.nodeIds = [...currentIds, nodeId];
          }
        });
      },

      updateNode: (nodeId, changes) => {
        const current = get().nodesById[nodeId];
        if (!current) return;
        set(state => {
          const target = state.nodesById[nodeId];
          if (!target) return;

          if (changes.position) {
            // Merge into existing position
            const prevPos = (target.schemaRef as NodeSchemaType).position ?? { x: 0, y: 0 };
            (target.schemaRef as NodeSchemaType).position = {
              ...prevPos,
              ...changes.position
            };
          }

          if (changes.size) {
            const prevSize = (target.schemaRef as NodeSchemaType).size ?? { width: 0, height: 0 };
            (target.schemaRef as NodeSchemaType).size = {
              ...prevSize,
              ...changes.size
            };
          }

          if (changes.props) {
            const prevProps = ((target.schemaRef as NodeSchemaType).props ?? {}) as Record<string, unknown>;
            (target.schemaRef as NodeSchemaType).props = {
              ...prevProps,
              ...changes.props
            };
          }

          if (changes.locked !== undefined) {
            target.locked = changes.locked;
          }

          if (changes.data !== undefined) {
            (target.schemaRef as NodeSchemaType).data = changes.data;
          }
        });
      },

      setNodeError: (nodeId, error) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          const target = state.nodesById[nodeId];
          if (!target) return;
          target.error = error;
        });
      },

      addConnection: conn => {
        set(state => {
          const source = state.nodesById[conn.sourceNodeId];
          const target = state.nodesById[conn.targetNodeId];

          const existingProps = (conn.props ?? {}) as Record<string, unknown>;
          const hasPath =
            typeof (existingProps as any).path === 'object' &&
            (existingProps as any).path &&
            (existingProps as any).path.kind === 'polyline' &&
            Array.isArray((existingProps as any).path.points);

          let nextProps: Record<string, unknown> = existingProps;
          if (!hasPath && source && target) {
            const points = buildDefaultManhattanPolyline(source, target);
            nextProps = {
              direction: (existingProps as any).direction ?? 'forward',
              ...existingProps,
              path: {
                kind: 'polyline',
                points
              }
            };
          }

          state.connections.push({
            ...conn,
            id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            ,
            props: nextProps
          });
        });
      },

      removeConnection: connId => {
        set(state => {
          state.connections = state.connections.filter(c => c.id !== connId);
        });
      },

      updateCanvas: changes => {
        set(state => {
          state.canvas = {
            ...state.canvas,
            ...changes
          };
        });
      },

      setDataSourceState: (id, partialState) => {
        set(state => {
          const existing = state.dataSources[id];
          state.dataSources[id] = {
            id,
            data: existing?.data ?? null,
            status: existing?.status ?? 'loading',
            lastUpdated: existing?.lastUpdated ?? Date.now(),
            ...partialState
          };
        });
      },

      updateDataSourceData: (id, data) => {
        set(state => {
          if (!state.dataSources[id]) {
            state.dataSources[id] = {
              id,
              data,
              status: 'connected',
              lastUpdated: Date.now()
            };
          } else {
            state.dataSources[id].data = data;
            state.dataSources[id].lastUpdated = Date.now();
            state.dataSources[id].status = 'connected';
          }
        });
      },

      // Layer Actions
      setNodeVisible: (nodeId, visible) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          const target = state.nodesById[nodeId];
          if (target) target.visible = visible;
        });
      },

      setNodeLocked: (nodeId, locked) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          const target = state.nodesById[nodeId];
          if (target) target.locked = locked;
        });
      },

      renameNode: (nodeId, name) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          const target = state.nodesById[nodeId];
          if (target && target.schemaRef) {
            (target.schemaRef as any).name = name;
          }
        });
      },

      reorderLayers: (nodeId, targetIndex) => {
        set(state => {
          const currentIndex = state.layerOrder.indexOf(nodeId);
          if (currentIndex === -1 || targetIndex < 0 || targetIndex >= state.layerOrder.length) return;
          
          // Remove from current position
          state.layerOrder.splice(currentIndex, 1);
          // Insert at target position
          state.layerOrder.splice(targetIndex, 0, nodeId);
        });
      },

      bringToFront: nodeIds => {
        set(state => {
          const remaining = state.layerOrder.filter(id => !nodeIds.includes(id));
          const toMove = state.layerOrder.filter(id => nodeIds.includes(id));
          state.layerOrder = [...remaining, ...toMove];
        });
      },

      sendToBack: nodeIds => {
        set(state => {
          const remaining = state.layerOrder.filter(id => !nodeIds.includes(id));
          const toMove = state.layerOrder.filter(id => nodeIds.includes(id));
          state.layerOrder = [...toMove, ...remaining];
        });
      },

      bringForward: nodeIds => {
        set(state => {
          nodeIds.forEach(nodeId => {
            const idx = state.layerOrder.indexOf(nodeId);
            if (idx >= 0 && idx < state.layerOrder.length - 1) {
              // Swap with next item
              const current = state.layerOrder[idx];
              const next = state.layerOrder[idx + 1];
              if (current !== undefined && next !== undefined) {
                state.layerOrder[idx] = next;
                state.layerOrder[idx + 1] = current;
              }
            }
          });
        });
      },

      sendBackward: nodeIds => {
        set(state => {
          // Process in reverse to handle multiple items correctly
          [...nodeIds].reverse().forEach(nodeId => {
            const idx = state.layerOrder.indexOf(nodeId);
            if (idx > 0) {
              // Swap with previous item
              const current = state.layerOrder[idx];
              const prev = state.layerOrder[idx - 1];
              if (current !== undefined && prev !== undefined) {
                state.layerOrder[idx] = prev;
                state.layerOrder[idx - 1] = current;
              }
            }
          });
        });
      },

      // Group Actions
      createGroup: (nodeIds, groupName) => {
        const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set(state => {
          state.layerGroups[groupId] = {
            id: groupId,
            name: groupName || `分组 ${Object.keys(state.layerGroups).length + 1}`,
            expanded: true,
            locked: false,
            visible: true,
            memberIds: nodeIds
          };
        });
        return groupId;
      },

      ungroup: groupId => {
        set(state => {
          delete state.layerGroups[groupId];
        });
      },

      toggleGroupExpanded: groupId => {
        set(state => {
          const group = state.layerGroups[groupId];
          if (group) group.expanded = !group.expanded;
        });
      },

      setGroupVisible: (groupId, visible) => {
        set(state => {
          const group = state.layerGroups[groupId];
          if (group) {
            group.visible = visible;
            // Also update all member nodes
            group.memberIds.forEach(nodeId => {
              const node = state.nodesById[nodeId];
              if (node) node.visible = visible;
            });
          }
        });
      },

      setGroupLocked: (groupId, locked) => {
        set(state => {
          const group = state.layerGroups[groupId];
          if (group) {
            group.locked = locked;
            // Also update all member nodes
            group.memberIds.forEach(nodeId => {
              const node = state.nodesById[nodeId];
              if (node) node.locked = locked;
            });
          }
        });
      },

      renameGroup: (groupId, name) => {
        set(state => {
          const group = state.layerGroups[groupId];
          if (group) group.name = name;
        });
      }
      })),
      {
        limit: 200,
        filter: (_state: unknown, delta: any) => {
          // Ignore selection changes in history
          if (delta && Object.keys(delta).length === 1 && delta.selection) {
            return false;
          }
          return true;
        }
      } as any
    )
  ) as unknown as KernelStore);


