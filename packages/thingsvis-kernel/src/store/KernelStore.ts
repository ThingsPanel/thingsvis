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
          state.connections.push({
            ...conn,
            id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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


