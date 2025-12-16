import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type { PageSchemaType, NodeSchemaType } from '@thingsvis/schema';

export type SelectionState = {
  nodeIds: string[];
};

export type CanvasState = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type NodeState = {
  id: string;
  schemaRef: NodeSchemaType;
  visible: boolean;
  runtimeData?: Record<string, unknown>;
  error?: string;
};

export type KernelState = {
  page?: PageSchemaType;
  nodesById: Record<string, NodeState>;
  selection: SelectionState;
  canvas: CanvasState;
};

export type KernelActions = {
  loadPage: (page: PageSchemaType) => void;
  addNodes: (nodes: NodeSchemaType[]) => void;
  selectNode: (nodeId: string) => void;
  updateNode: (
    nodeId: string,
    changes: {
      position?: { x: number; y: number };
      props?: Record<string, unknown>;
    }
  ) => void;
  setNodeError: (nodeId: string, error: string) => void;
};

const defaultCanvas: CanvasState = { zoom: 1, offsetX: 0, offsetY: 0 };

export const createKernelStore = () =>
  createStore(
    temporal(
      immer<KernelState & KernelActions>((set, get) => ({
      page: undefined,
      nodesById: {},
      selection: { nodeIds: [] },
      canvas: defaultCanvas,

      loadPage: page => {
        const nodesById: Record<string, NodeState> = {};
        page.nodes.forEach(node => {
          nodesById[node.id] = {
            id: node.id,
            schemaRef: node,
            visible: true
          };
        });
        set(state => {
          state.page = page;
          state.nodesById = nodesById;
          state.selection = { nodeIds: [] };
          state.canvas = { ...defaultCanvas };
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
              runtimeData: existing?.runtimeData,
              error: undefined
            };
          });
        });
      },

      selectNode: nodeId => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          state.selection = { nodeIds: [nodeId] };
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

          if (changes.props) {
            const prevProps = ((target.schemaRef as NodeSchemaType).props ?? {}) as Record<string, unknown>;
            (target.schemaRef as NodeSchemaType).props = {
              ...prevProps,
              ...changes.props
            };
          }
        });
      },

      setNodeError: (nodeId, error) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          state.nodesById[nodeId].error = error;
        });
      }
      })),
      {
        limit: 200
      }
    )
  );

export type KernelStore = ReturnType<typeof createKernelStore>;


