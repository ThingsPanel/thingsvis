/**
 * usePlatformData Hook
 * Subscribes to PlatformDataStore changes and triggers re-render when data updates.
 */
import { useSyncExternalStore, useCallback } from 'react';
import { PlatformDataStore } from '../engine/PlatformDataStore';

/**
 * Hook to subscribe to platform data changes
 * Returns the current platform data object
 */
export function usePlatformData(): Record<string, any> {
    const subscribe = useCallback((onStoreChange: () => void) => {
        return PlatformDataStore.subscribe(onStoreChange);
    }, []);

    const getSnapshot = useCallback(() => {
        return PlatformDataStore.getAll();
    }, []);

    return useSyncExternalStore(subscribe, getSnapshot);
}
