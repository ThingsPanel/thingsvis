import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, DataSourceRuntimeState } from '../types';

export type DataSourceSliceState = {
  dataSources: Record<string, DataSourceRuntimeState>;
};

export type DataSourceSliceActions = Pick<
  KernelActions,
  'setDataSourceState' | 'updateDataSourceData' | 'removeDataSourceFromStore'
>;

export type DataSourceSlice = DataSourceSliceState & DataSourceSliceActions;

function isSameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (!a || !b) return false;
  if (typeof a !== 'object') return false;

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export const createDataSourceSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  DataSourceSlice
> = (set) => ({
  dataSources: {},

  setDataSourceState: (id, partialState) => {
    set((state) => {
      const existing = state.dataSources[id];
      const nextState = {
        id,
        data: existing?.data ?? null,
        status: existing?.status ?? 'loading',
        lastUpdated: existing?.lastUpdated ?? Date.now(),
        ...partialState,
      };

      if (
        existing &&
        existing.status === nextState.status &&
        existing.error === nextState.error &&
        isSameValue(existing.data, nextState.data)
      ) {
        return;
      }

      state.dataSources[id] = nextState;
    });
  },

  updateDataSourceData: (id, data) => {
    set((state) => {
      if (!state.dataSources[id]) {
        state.dataSources[id] = {
          id,
          data,
          status: 'connected',
          lastUpdated: Date.now(),
        };
      } else {
        if (
          state.dataSources[id].status === 'connected' &&
          isSameValue(state.dataSources[id].data, data)
        ) {
          return;
        }
        state.dataSources[id].data = data;
        state.dataSources[id].lastUpdated = Date.now();
        state.dataSources[id].status = 'connected';
      }
    });
  },

  removeDataSourceFromStore: (id) => {
    set((state) => {
      const next = { ...state.dataSources };
      delete next[id];
      state.dataSources = next;
    });
  },
});
