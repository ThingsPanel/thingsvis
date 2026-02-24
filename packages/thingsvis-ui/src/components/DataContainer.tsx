import React, { useMemo, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { type KernelStore, type KernelState } from '@thingsvis/kernel';
import { PropertyResolver } from '../engine/PropertyResolver';
import { usePlatformData } from '../hooks/usePlatformData';

interface DataContainerProps {
  store: KernelStore;
  nodeId: string;
  children: (resolvedProps: Record<string, any>) => React.ReactElement;
}

/**
 * DataContainer: A component that resolves data bindings in props before rendering children.
 * Useful for React-based widget renderers.
 */
export const DataContainer: React.FC<DataContainerProps> = ({ store, nodeId, children }) => {
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState
  );

  // Subscribe to platform data changes for {{ platform.xxx }} expressions
  const platformData = usePlatformData();

  const node = kernelState.nodesById[nodeId];

  const resolvedProps = useMemo(() => {
    if (!node) return {};
    return PropertyResolver.resolve(node, kernelState.dataSources, platformData);
  }, [node, kernelState.dataSources, platformData]);

  return children(resolvedProps);
};

