import { useEffect, useState } from 'react';
import { type KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from './useDataRegistry';

/**
 * useRealtimeData: Optimized hook for high-frequency data updates.
 * Supports React Bypass mode: if onUpdate is provided, it can be used to
 * update Leafer/DOM elements directly without triggering a component re-render.
 */
export const useRealtimeData = (
  store: KernelStore, 
  id: string, 
  onUpdate?: (data: any) => void,
  shouldReRender: boolean = true
) => {
  const { subscribeToDataSource } = useDataSourceRegistry(store);
  const [lastData, setLastData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeToDataSource(id, (data) => {
      // 1. Direct update (React Bypass)
      if (onUpdate) {
        onUpdate(data);
      }
      
      // 2. Optional re-render
      if (shouldReRender) {
        setLastData(data);
      }
    });
    return unsubscribe;
  }, [id, subscribeToDataSource, onUpdate, shouldReRender]);

  return lastData;
};

