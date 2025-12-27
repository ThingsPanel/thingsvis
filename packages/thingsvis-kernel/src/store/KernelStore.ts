import { createStore } from 'zustand/vanilla';
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

export type KernelState = {
  page?: IPage | PageSchemaType;
  nodesById: Record<string, NodeState>;
  connections: ConnectionState[];
  selection: SelectionState;
  canvas: CanvasState;
  dataSources: Record<string, DataSourceRuntimeState>;
};

export type KernelActions = {
  loadPage: (page: IPage | PageSchemaType) => void;
  addNodes: (nodes: NodeSchemaType[]) => void;
  selectNode: (nodeId: string | null) => void;
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
  createStore(
    temporal(
      immer<KernelState & KernelActions>((set, get) => ({
      page: undefined,
      nodesById: {},
      connections: [],
      selection: { nodeIds: [] },
      canvas: defaultCanvas,
      dataSources: {},

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
          });
        });
      },

      selectNode: nodeId => {
        if (nodeId && !get().nodesById[nodeId]) return;
        set(state => {
          state.selection = { nodeIds: nodeId ? [nodeId] : [] };
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
      }
      })),
      {
        limit: 200,
        filter: (state, delta) => {
          // Ignore selection changes in history
          if (delta && Object.keys(delta).length === 1 && delta.selection) {
            return false;
          }
          return true;
        }
      }
    )
  );

export type KernelStore = ReturnType<typeof createKernelStore>;


