import { useSyncExternalStore, useCallback } from 'react';
import { type KernelStore, type DataSourceRuntimeState } from '@thingsvis/kernel';

/**
 * useDataSource: Reactive hook to access a specific data source's data and status.
 * Uses useSyncExternalStore for efficient state tracking from the kernel store.
 */
export const useDataSource = (store: KernelStore, id: string): DataSourceRuntimeState => {
  const state = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () =>
      store.getState().dataSources[id] ||
      ({
        id,
        data: null,
        status: 'disconnected' as const,
        lastUpdated: 0
      } satisfies DataSourceRuntimeState)
  );

  return state;
};

