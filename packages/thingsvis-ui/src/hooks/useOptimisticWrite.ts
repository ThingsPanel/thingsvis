import { useState, useRef, useCallback } from 'react';
import type { DataSourceManager } from '@thingsvis/kernel';
import { dataSourceManager as defaultDataSourceManager } from '@thingsvis/kernel';

interface UseOptimisticWriteOptions<T> {
  /**
   * Called immediately when `write()` is invoked, before the async write completes.
   * Update your local display state here for instant feedback.
   */
  onOptimisticUpdate?: (payload: T) => void;
  /**
   * Called when the write operation fails or times out.
   * Restore the previous display state here.
   */
  onRollback?: (previousPayload: T | undefined) => void;
  /**
   * Timeout in milliseconds before treating a pending write as failed and rolling back.
   * Default: 5000ms
   */
  timeout?: number;
  dataSourceManager?: Pick<DataSourceManager, 'writeDataSource'>;
}

interface OptimisticWriteState {
  isPending: boolean;
  error: string | null;
}

interface UseOptimisticWriteReturn<T> {
  write: (payload: T) => void;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * useOptimisticWrite — optimistic UI state hook for interactive widgets.
 *
 * Usage pattern:
 * ```
 * const { write, isPending } = useOptimisticWrite<boolean>('ds_switch_001', {
 *   onOptimisticUpdate: (v) => setDisplayValue(v),
 *   onRollback: () => setDisplayValue(prev),
 * });
 * // On user interaction:
 * write(true); // immediately shows "on", sends POST, rolls back on failure
 * ```
 *
 * @param dataSourceId  The ID of the data source adapter to write to
 * @param options       Callbacks and timeout configuration
 */
export function useOptimisticWrite<T = unknown>(
  dataSourceId: string,
  options: UseOptimisticWriteOptions<T> = {},
): UseOptimisticWriteReturn<T> {
  const {
    onOptimisticUpdate,
    onRollback,
    timeout = 5000,
    dataSourceManager = defaultDataSourceManager,
  } = options;

  const [state, setState] = useState<OptimisticWriteState>({
    isPending: false,
    error: null,
  });

  // Track the last payload for rollback
  const lastPayloadRef = useRef<T | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const write = useCallback(
    (payload: T) => {
      clearPendingTimeout();

      // Optimistic update — update display immediately
      lastPayloadRef.current = payload;
      if (onOptimisticUpdate) onOptimisticUpdate(payload);

      setState({ isPending: true, error: null });

      // Set a rollback timeout
      timeoutRef.current = setTimeout(() => {
        // Write timed out — roll back display
        if (onRollback) onRollback(lastPayloadRef.current);
        setState({
          isPending: false,
          error: `Write timed out after ${timeout}ms`,
        });
      }, timeout);

      // Fire the actual write
      dataSourceManager
        .writeDataSource(dataSourceId, payload)
        .then((result) => {
          clearPendingTimeout();
          if (result.success) {
            setState({ isPending: false, error: null });
          } else {
            // Write failed — roll back
            if (onRollback) onRollback(lastPayloadRef.current);
            setState({ isPending: false, error: result.error ?? 'Write failed' });
          }
        })
        .catch((e: unknown) => {
          clearPendingTimeout();
          const msg = e instanceof Error ? e.message : String(e);
          if (onRollback) onRollback(lastPayloadRef.current);
          setState({ isPending: false, error: msg });
        });
    },
    [dataSourceId, onOptimisticUpdate, onRollback, timeout],
  );

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    write,
    isPending: state.isPending,
    error: state.error,
    clearError,
  };
}
