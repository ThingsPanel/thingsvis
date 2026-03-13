/**
 * useHistoryState Hook
 * 
 * React hook for tracking undo/redo availability.
 * Connects to the kernel's temporal store.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { store } from '../lib/store'

// =============================================================================
// Types
// =============================================================================

export interface HistoryState {
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Number of past states */
  pastCount: number
  /** Number of future states */
  futureCount: number
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for tracking undo/redo state.
 * 
 * @example
 * ```tsx
 * function Editor() {
 *   const { canUndo, canRedo, undo, redo } = useHistoryState()
 *   return (
 *     <div>
 *       <button onClick={undo} disabled={!canUndo}>Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>Redo</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useHistoryState() {
  // Subscribe to temporal store changes
  const temporalSnapshot = useSyncExternalStore(
    useCallback(
      (callback) => store.temporal.subscribe(callback),
      []
    ),
    () => store.temporal.getState(),
    () => store.temporal.getState()
  )

  // Compute history state
  const historyState: HistoryState = useMemo(() => {
    const pastStates = temporalSnapshot.pastStates ?? []
    const futureStates = temporalSnapshot.futureStates ?? []
    
    return {
      canUndo: pastStates.length > 0,
      canRedo: futureStates.length > 0,
      pastCount: pastStates.length,
      futureCount: futureStates.length,
    }
  }, [temporalSnapshot])

  // Undo action
  const undo = useCallback(() => {
    if (historyState.canUndo) {
      store.temporal.getState().undo()
    }
  }, [historyState.canUndo])

  // Redo action
  const redo = useCallback(() => {
    if (historyState.canRedo) {
      store.temporal.getState().redo()
    }
  }, [historyState.canRedo])

  // Clear history
  const clear = useCallback(() => {
    store.temporal.getState().clear()
  }, [])

  return {
    ...historyState,
    undo,
    redo,
    clear,
  }
}

export default useHistoryState
