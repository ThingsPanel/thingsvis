import React, { useMemo, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { type KernelStore, type KernelState } from '@thingsvis/kernel';
import { PropertyResolver } from '../engine/PropertyResolver';

interface DataContainerProps {
  store: KernelStore;
  nodeId: string;
  children: (resolvedProps: Record<string, any>) => React.ReactElement;
}

/**
 * DataContainer: A component that resolves data bindings in props before rendering children.
 * Useful for React-based plugin renderers.
 */
export const DataContainer: React.FC<DataContainerProps> = ({ store, nodeId, children }) => {
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState
  );

  const node = kernelState.nodesById[nodeId];

  const resolvedProps = useMemo(() => {
    if (!node) return {};
    return PropertyResolver.resolve(node, kernelState.dataSources);
  }, [node, kernelState.dataSources]);

  return children(resolvedProps);
};

