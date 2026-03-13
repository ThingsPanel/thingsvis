import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, LayerGroup } from '../types';

export type LayerSliceState = {
  layerOrder: string[]; // node ids in render order (bottom to top)
  layerGroups: Record<string, LayerGroup>;
};

export type LayerSliceActions = Pick<
  KernelActions,
  | 'reorderLayers'
  | 'bringToFront'
  | 'sendToBack'
  | 'bringForward'
  | 'sendBackward'
  | 'createGroup'
  | 'ungroup'
  | 'toggleGroupExpanded'
  | 'setGroupVisible'
  | 'setGroupLocked'
  | 'renameGroup'
>;

export type LayerSlice = LayerSliceState & LayerSliceActions;

export const createLayerSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  LayerSlice
> = (set) => ({
  layerOrder: [],
  layerGroups: {},

  reorderLayers: (nodeId, targetIndex) => {
    set((state) => {
      const currentIndex = state.layerOrder.indexOf(nodeId);
      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= state.layerOrder.length) return;

      // Remove from current position
      state.layerOrder.splice(currentIndex, 1);
      // Insert at target position
      state.layerOrder.splice(targetIndex, 0, nodeId);
    });
  },

  bringToFront: (nodeIds) => {
    set((state) => {
      const remaining = state.layerOrder.filter((id) => !nodeIds.includes(id));
      const toMove = state.layerOrder.filter((id) => nodeIds.includes(id));
      state.layerOrder = [...remaining, ...toMove];
    });
  },

  sendToBack: (nodeIds) => {
    set((state) => {
      const remaining = state.layerOrder.filter((id) => !nodeIds.includes(id));
      const toMove = state.layerOrder.filter((id) => nodeIds.includes(id));
      state.layerOrder = [...toMove, ...remaining];
    });
  },

  bringForward: (nodeIds) => {
    set((state) => {
      nodeIds.forEach((nodeId) => {
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

  sendBackward: (nodeIds) => {
    set((state) => {
      // Process in reverse to handle multiple items correctly
      [...nodeIds].reverse().forEach((nodeId) => {
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
    set((state) => {
      state.layerGroups[groupId] = {
        id: groupId,
        name: groupName || `分组 ${Object.keys(state.layerGroups).length + 1}`,
        expanded: true,
        locked: false,
        visible: true,
        memberIds: nodeIds,
      };
    });
    return groupId;
  },

  ungroup: (groupId) => {
    set((state) => {
      delete state.layerGroups[groupId];
    });
  },

  toggleGroupExpanded: (groupId) => {
    set((state) => {
      const group = state.layerGroups[groupId];
      if (group) group.expanded = !group.expanded;
    });
  },

  setGroupVisible: (groupId, visible) => {
    set((state) => {
      const group = state.layerGroups[groupId];
      if (group) {
        group.visible = visible;
        // Also update all member nodes
        group.memberIds.forEach((nodeId) => {
          const node = state.nodesById[nodeId];
          if (node) node.visible = visible;
        });
      }
    });
  },

  setGroupLocked: (groupId, locked) => {
    set((state) => {
      const group = state.layerGroups[groupId];
      if (group) {
        group.locked = locked;
        // Also update all member nodes
        group.memberIds.forEach((nodeId) => {
          const node = state.nodesById[nodeId];
          if (node) node.locked = locked;
        });
      }
    });
  },

  renameGroup: (groupId, name) => {
    set((state) => {
      const group = state.layerGroups[groupId];
      if (group) group.name = name;
    });
  },
});
