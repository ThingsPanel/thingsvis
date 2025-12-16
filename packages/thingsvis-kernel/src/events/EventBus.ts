export type EventPayload = {
  type: string;
  sourceId?: string;
  timestamp: number;
  payload?: unknown;
};

type Handler = (event: EventPayload) => void;

export class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map();

  subscribe(type: string, handler: Handler): () => void {
    const set = this.handlers.get(type) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(type, set);
    return () => {
      set.delete(handler);
    };
  }

  publish(event: EventPayload): void {
    const set = this.handlers.get(event.type);
    if (!set) return;
    set.forEach(h => h(event));
  }
}


