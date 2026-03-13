import { useCallback, useRef } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import type { EventHandlerConfig, ActionConfigItem } from '../engine/executeActions';
import { executeAction } from '../engine/executeActions';

interface UseActionExecutorReturn {
  /**
   * Execute all actions registered for the given event name.
   * Typically called from widget `emit` callbacks.
   *
   * @param event    The event name (e.g. 'click', 'change')
   * @param payload  The event payload emitted by the widget (e.g. `{ value: 42 }`)
   */
  execute: (event: string, payload?: unknown) => void;
}

/**
 * useActionExecutor — React hook that wraps the kernel action system.
 *
 * Given a list of EventHandlerConfig, returns an `execute(event, payload)` function
 * that finds matching handlers and runs their action lists against the kernel store.
 *
 * Usage:
 * ```tsx
 * const { execute } = useActionExecutor(node.eventHandlers, store);
 * // In widget:
 * ctx.emit = (event, payload) => execute(event, payload);
 * ```
 *
 * @param handlers  Array of { event, actions[] } configs from the node definition
 * @param store     The KernelStore instance (for setVariable, store reads, etc.)
 */
export function useActionExecutor(
  handlers: EventHandlerConfig[],
  store: KernelStore,
): UseActionExecutorReturn {
  // Keep a stable ref to handlers so execute() doesn't need to re-create on each render
  const handlersRef = useRef<EventHandlerConfig[]>(handlers);
  handlersRef.current = handlers;

  const execute = useCallback(
    (event: string, payload?: unknown) => {
      const state = store.getState();
      const matchingHandlers = handlersRef.current.filter((h) => h.event === event);

      for (const handler of matchingHandlers) {
        for (const action of handler.actions as ActionConfigItem[]) {
          try {
            executeAction(action, state, payload);
          } catch (e) {
            console.error('[useActionExecutor] Action execution error:', action, e);
          }
        }
      }
    },
    [store],
  );

  return { execute };
}
