export type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
  }

  off<TPayload = unknown>(event: string, handler: EventHandler<TPayload>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<TPayload = unknown>(event: string, payload: TPayload): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload as unknown));
  }
}

/** @deprecated Use runtime.eventBus from createRuntimeServices(). */
export const eventBus = new EventBus();
