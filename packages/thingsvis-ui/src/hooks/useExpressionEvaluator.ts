import { useMemo, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { type KernelStore, type KernelState } from '@thingsvis/kernel';
import { ExpressionEvaluator } from '@thingsvis/utils';

/**
 * useExpressionEvaluator: React hook to evaluate expressions against the data source registry.
 */
export const useExpressionEvaluator = (store: KernelStore) => {
  const dataSources = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState().dataSources
  );

  const evaluate = useCallback((expression: string) => {
    return ExpressionEvaluator.evaluate(expression, { ds: dataSources });
  }, [dataSources]);

  return { evaluate };
};

