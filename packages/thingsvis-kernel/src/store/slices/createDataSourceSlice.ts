import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, DataSourceRuntimeState } from '../types';
import { extractFieldSchema } from '../../utils/extractFieldSchema';

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
        rawData: existing?.rawData ?? null,
        status: existing?.status ?? 'loading',
        lastUpdated: existing?.lastUpdated ?? Date.now(),
        fieldSchema: existing?.fieldSchema,
        fieldSchemaUpdatedAt: existing?.fieldSchemaUpdatedAt,
        ...partialState,
      };

      if (
        existing &&
        existing.status === nextState.status &&
        existing.error === nextState.error &&
        isSameValue(existing.data, nextState.data) &&
        isSameValue(existing.rawData, nextState.rawData) &&
        isSameValue(existing.fieldSchema, nextState.fieldSchema)
      ) {
        return;
      }

      state.dataSources[id] = nextState;
    });
  },

  updateDataSourceData: (id, data, rawData) => {
    set((state) => {
      const fieldSchema = extractFieldSchema(data);
      const fieldSchemaUpdatedAt = Date.now();

      if (!state.dataSources[id]) {
        state.dataSources[id] = {
          id,
          data,
          rawData,
          status: 'connected',
          lastUpdated: fieldSchemaUpdatedAt,
          fieldSchema,
          fieldSchemaUpdatedAt,
        };
      } else {
        if (
          state.dataSources[id].status === 'connected' &&
          isSameValue(state.dataSources[id].data, data) &&
          isSameValue(state.dataSources[id].rawData, rawData) &&
          isSameValue(state.dataSources[id].fieldSchema, fieldSchema)
        ) {
          return;
        }
        state.dataSources[id].data = data;
        state.dataSources[id].rawData = rawData;
        state.dataSources[id].lastUpdated = fieldSchemaUpdatedAt;
        state.dataSources[id].status = 'connected';
        state.dataSources[id].fieldSchema = fieldSchema;
        state.dataSources[id].fieldSchemaUpdatedAt = fieldSchemaUpdatedAt;
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
