import { useEffect, useState, useCallback } from 'react';
import { type KernelStore, type DataSourceRuntimeState } from '@thingsvis/kernel';

/**
 * useDataSourceRegistry: Subscribes to the global data source states in the kernel store.
 * Supports React Bypass mode by providing a direct subscription method.
 */
export const useDataSourceRegistry = (store: KernelStore) => {
  // Standard React state for reactive UI updates (e.g., status indicators)
  const [states, setStates] = useState<Record<string, DataSourceRuntimeState>>(
    store.getState().dataSources
  );

  useEffect(() => {
    // Subscribe to state changes in the store
    const unsubscribe = store.subscribe((state) => {
      setStates(state.dataSources);
    });
    return unsubscribe;
  }, [store]);

  /**
   * Direct subscription for high-frequency updates (React Bypass)
   * Allows external systems (like VisualEngine) to receive raw data without React re-renders.
   */
  const subscribeToDataSource = useCallback((
    id: string, 
    callback: (data: any) => void
  ) => {
    // Initial data if exists
    const initialState = store.getState().dataSources[id];
    if (initialState) {
      callback(initialState.data);
    }

    return store.subscribe((state, prevState) => {
      const current = state.dataSources[id];
      const prev = prevState.dataSources[id];
      
      // Only notify if data has actually changed
      if (current && current.data !== prev?.data) {
        callback(current.data);
      }
    });
  }, [store]);

  return {
    states,
    subscribeToDataSource
  };
};

