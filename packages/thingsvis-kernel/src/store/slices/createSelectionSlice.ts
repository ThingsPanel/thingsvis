import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, SelectionState } from '../types';

export type SelectionSliceState = {
  selection: SelectionState;
};

export type SelectionSliceActions = Pick<
  KernelActions,
  'selectNode' | 'selectNodes' | 'toggleNodeSelection'
>;

export type SelectionSlice = SelectionSliceState & SelectionSliceActions;

export const createSelectionSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  SelectionSlice
> = (set, get) => ({
  selection: { nodeIds: [] },

  selectNode: (nodeId) => {
    if (nodeId && !get().nodesById[nodeId]) return;
    set((state) => {
      state.selection = { nodeIds: nodeId ? [nodeId] : [] };
    });
  },

  selectNodes: (nodeIds) => {
    const validIds = nodeIds.filter((id) => get().nodesById[id]);
    set((state) => {
      state.selection = { nodeIds: validIds };
    });
  },

  toggleNodeSelection: (nodeId) => {
    if (!get().nodesById[nodeId]) return;
    set((state) => {
      const currentIds = state.selection.nodeIds;
      if (currentIds.includes(nodeId)) {
        // Remove from selection
        state.selection.nodeIds = currentIds.filter((id: string) => id !== nodeId);
      } else {
        // Add to selection
        state.selection.nodeIds = [...currentIds, nodeId];
      }
    });
  },
});
