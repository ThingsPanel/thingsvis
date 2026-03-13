/**
 * EventBus — per-dashboard publish/subscribe event bus.
 *
 * Enables cross-widget communication:
 *   widget A:  emit('device:selected', { id: 'abc' })
 *   widget B:  on('device:selected', ({ id }) => updateUI(id))
 *
 * Lifecycle:
 *   - `on()` returns an unsubscribe function — widgets MUST call it on destroy
 *   - `dispose()` removes ALL handlers (call when the dashboard is unmounted)
 */

export type EventHandler = (payload?: unknown) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  /**
   * Publish an event to all subscribers.
   * Handlers are called synchronously in registration order.
   */
  emit(event: string, payload?: unknown): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Copy to avoid mutation issues if a handler calls on/off during iteration
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Handler error for event "${event}":`, err);
      }
    }
  }

  /**
   * Subscribe to an event.
   * @returns Unsubscribe function — call this when the widget/component is destroyed.
   */
  on(event: string, handler: EventHandler): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
    return () => {
      set!.delete(handler);
      if (set!.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * One-time subscription — automatically unsubscribes after first call.
   */
  once(event: string, handler: EventHandler): () => void {
    const wrapped: EventHandler = (payload) => {
      unsub();
      handler(payload);
    };
    const unsub = this.on(event, wrapped);
    return unsub;
  }

  /**
   * Remove all handlers. Call when the dashboard is unmounted.
   */
  dispose(): void {
    this.handlers.clear();
  }

  /**
   * Returns the number of active subscriptions for debugging.
   */
  get subscriptionCount(): number {
    let count = 0;
    for (const set of this.handlers.values()) {
      count += set.size;
    }
    return count;
  }
}
