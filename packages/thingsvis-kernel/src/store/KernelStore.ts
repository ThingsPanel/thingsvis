import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { PageSchemaType, NodeSchemaType } from '@thingsvis/schema';
import { Command, HistoryManager } from '../history/HistoryManager';

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
  history: {
    past: Command[];
    future: Command[];
  };
};

export type KernelActions = {
  loadPage: (page: PageSchemaType) => void;
  addNodes: (nodes: NodeSchemaType[]) => void;
  selectNode: (nodeId: string) => void;
  addCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  setNodeError: (nodeId: string, error: string) => void;
};

const defaultCanvas: CanvasState = { zoom: 1, offsetX: 0, offsetY: 0 };

export const createKernelStore = () =>
  createStore<KernelState & KernelActions>()(
    immer((set, get) => ({
      page: undefined,
      nodesById: {},
      selection: { nodeIds: [] },
      canvas: defaultCanvas,
      history: { past: [], future: [] },

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
          state.history = { past: [], future: [] };
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
        const command: Command = {
          id: `select-${nodeId}-${Date.now()}`,
          type: 'node.select',
          payload: { nodeId, previous: get().selection.nodeIds },
          execute: state => {
            state.selection = { nodeIds: [nodeId] };
            return state;
          },
          undo: state => {
            state.selection = { nodeIds: get().history.past.at(-1)?.payload.previous ?? [] };
            return state;
          }
        };
        get().addCommand(command);
      },

      addCommand: command => {
        set(state => {
          // apply
          command.execute(state as KernelState);
          state.history.past.push(command);
          state.history.future = [];
        });
      },

      undo: () => {
        const { history } = get();
        const command = history.past.pop();
        if (!command) return;
        set(state => {
          command.undo(state as KernelState);
          state.history.future.push(command);
        });
      },

      redo: () => {
        const { history } = get();
        const command = history.future.pop();
        if (!command) return;
        set(state => {
          command.execute(state as KernelState);
          state.history.past.push(command);
        });
      },

      setNodeError: (nodeId, error) => {
        if (!get().nodesById[nodeId]) return;
        set(state => {
          state.nodesById[nodeId].error = error;
        });
      }
    }))
  );

export type KernelStore = ReturnType<typeof createKernelStore>;


