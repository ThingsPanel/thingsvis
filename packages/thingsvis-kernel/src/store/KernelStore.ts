import { createStore, type StoreApi } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type { KernelStoreState, KernelStore, KernelState, KernelActions } from './types';

import { createCanvasSlice } from './slices/createCanvasSlice';
import { createPageSlice } from './slices/createPageSlice';
import { createNodeSlice } from './slices/createNodeSlice';
import { createSelectionSlice } from './slices/createSelectionSlice';
import { createLayerSlice } from './slices/createLayerSlice';
import { createConnectionSlice } from './slices/createConnectionSlice';
import { createDataSourceSlice } from './slices/createDataSourceSlice';
import { createVariableSlice } from './slices/createVariableSlice';
import { createGridSlice } from './slices/createGridSlice';

export * from './types';

export const createKernelStore = () =>
  createStore<KernelStoreState>()(
    (temporal as any)(
      immer<KernelState & KernelActions>((...a) => ({
        ...createPageSlice(...a),
        ...createCanvasSlice(...a),
        ...createNodeSlice(...a),
        ...createSelectionSlice(...a),
        ...createLayerSlice(...a),
        ...createConnectionSlice(...a),
        ...createDataSourceSlice(...a),
        ...createVariableSlice(...a),
        ...createGridSlice(...a),
      })),
      {
        limit: 200,
        filter: (_state: unknown, delta: any) => {
          // Ignore selection changes in history
          if (delta && Object.keys(delta).length === 1 && delta.selection) {
            return false;
          }
          return true;
        },
      } as any,
    ),
  ) as unknown as KernelStore;
