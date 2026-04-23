import React, { useMemo, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { type KernelStore, type KernelState } from '@thingsvis/kernel';
import { PropertyResolver } from '../engine/PropertyResolver';

interface DataContainerProps {
  store: KernelStore;
  nodeId: string;
  children: (resolvedProps: Record<string, unknown>) => React.ReactElement;
}

/**
 * DataContainer: A component that resolves data bindings in props before rendering children.
 * Useful for React-based widget renderers.
 * Platform data is accessed through explicit data source bindings in the kernel store.
 */
export const DataContainer: React.FC<DataContainerProps> = ({ store, nodeId, children }) => {
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
  );

  const node = kernelState.nodesById[nodeId];

  const resolvedProps = useMemo(() => {
    if (!node) return {};
    const variableValues = (
      kernelState as KernelState & { variableValues?: Record<string, unknown> }
    ).variableValues;
    return PropertyResolver.resolve(
      node,
      kernelState.dataSources as Record<string, unknown>,
      variableValues,
    );
  }, [
    node,
    kernelState.dataSources,
    (kernelState as KernelState & { variableValues?: Record<string, unknown> }).variableValues,
  ]);

  return children(resolvedProps);
};
