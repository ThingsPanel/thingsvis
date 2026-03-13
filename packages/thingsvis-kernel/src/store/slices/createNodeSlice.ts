import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, NodeState } from '../types';
import type { NodeSchemaType } from '@thingsvis/schema';

export type NodeSliceState = {
  nodesById: Record<string, NodeState>;
};

export type NodeSliceActions = Pick<
  KernelActions,
  | 'addNodes'
  | 'removeNodes'
  | 'updateNode'
  | 'setNodeError'
  | 'setNodeVisible'
  | 'setNodeLocked'
  | 'renameNode'
>;

export type NodeSlice = NodeSliceState & NodeSliceActions;

export const createNodeSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  NodeSlice
> = (set, get) => ({
  nodesById: {},

  addNodes: (nodes) => {
    set((state) => {
      nodes.forEach((node) => {
        const existing = state.nodesById[node.id];
        state.nodesById[node.id] = {
          id: node.id,
          schemaRef: node,
          visible: existing?.visible ?? true,
          locked: existing?.locked ?? false,
          runtimeData: existing?.runtimeData,
          error: undefined,
        };
        // Add to layer order if new
        if (!state.layerOrder.includes(node.id)) {
          state.layerOrder.push(node.id);
        }
      });
    });
  },

  removeNodes: (nodeIds) => {
    const currentState = get();
    const isGridMode = currentState.canvas.mode === 'grid';

    set((state) => {
      nodeIds.forEach((nodeId) => {
        delete state.nodesById[nodeId];
        state.layerOrder = state.layerOrder.filter((id: string) => id !== nodeId);
        // Remove from any group
        Object.values(state.layerGroups).forEach((group) => {
          group.memberIds = group.memberIds.filter((id) => id !== nodeId);
        });
      });
      // Clear selection if removed
      state.selection.nodeIds = state.selection.nodeIds.filter(
        (id: string) => !nodeIds.includes(id),
      );
    });

    // Trigger grid compaction after node deletion in grid mode
    if (isGridMode && currentState.gridState.settings?.compactVertical !== false) {
      get().compactGrid();
    }
  },

  updateNode: (nodeId, changes) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const target = state.nodesById[nodeId];
      if (!target) return;

      if (changes.position) {
        const prevPos = target.schemaRef.position ?? { x: 0, y: 0 };
        target.schemaRef.position = {
          ...prevPos,
          ...changes.position,
        };
      }

      if (changes.size) {
        const prevSize = target.schemaRef.size ?? { width: 0, height: 0 };
        target.schemaRef.size = {
          ...prevSize,
          ...changes.size,
        };
      }

      if (changes.props) {
        const prevProps = (target.schemaRef.props ?? {}) as Record<string, unknown>;
        target.schemaRef.props = {
          ...prevProps,
          ...changes.props,
        };
      }

      if (changes.locked !== undefined) {
        target.locked = changes.locked;
      }

      if (changes.grid !== undefined) {
        const prevGrid = target.schemaRef.grid ?? {};
        target.schemaRef.grid = {
          ...prevGrid,
          ...changes.grid,
        } as typeof target.schemaRef.grid;
      }

      if (changes.data !== undefined) {
        // Direct in-place mutation — consistent with all other fields above.
        // Using a schemaRef replacement with a pre-set snapshot would silently
        // discard any props/position/size changes made earlier in this same set call.
        target.schemaRef.data = changes.data as typeof target.schemaRef.data;
      }

      if (changes.events !== undefined) {
        target.schemaRef.events = changes.events as typeof target.schemaRef.events;
      }

      if (changes.baseStyle !== undefined) {
        target.schemaRef.baseStyle = changes.baseStyle;
      }
    });
  },

  setNodeError: (nodeId, error) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const target = state.nodesById[nodeId];
      if (!target) return;
      target.error = error;
    });
  },

  setNodeVisible: (nodeId, visible) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const target = state.nodesById[nodeId];
      if (target) target.visible = visible;
    });
  },

  setNodeLocked: (nodeId, locked) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const target = state.nodesById[nodeId];
      if (target) target.locked = locked;
    });
  },

  renameNode: (nodeId, name) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const target = state.nodesById[nodeId];
      if (target && target.schemaRef) {
        target.schemaRef.name = name;
      }
    });
  },
});
