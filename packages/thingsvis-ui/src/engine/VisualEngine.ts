import type { KernelStore, KernelState, NodeState } from '@thingsvis/kernel';
import type { NodeSchemaType } from '@thingsvis/schema';
import { App, Rect, Group } from 'leafer-ui';

export class VisualEngine {
  private app?: App;
  private instanceMap = new Map<string, Rect>();
  private root?: Group;
  private unsubscribe?: () => void;

  constructor(private store: KernelStore) {}

  mount(container: HTMLElement) {
    this.app = new App({
      view: container,
      tree: {}
    });
    this.root = this.app.tree as Group;

    // Subscribe to store updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState() as KernelState;
      this.sync(state.nodesById);
    });
    // Initial sync
    const state = this.store.getState() as KernelState;
    this.sync(state.nodesById);
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = undefined;
    this.app?.destroy?.();
    this.app = undefined;
    this.root = undefined;
    this.instanceMap.clear();
  }

  sync(nodes: Record<string, NodeState>) {
    if (!this.app || !this.root) return;

    // Remove nodes that no longer exist or are hidden
    for (const [id, instance] of Array.from(this.instanceMap.entries())) {
      const nextNode = nodes[id];
      if (!nextNode || !nextNode.visible) {
        instance.remove();
        this.instanceMap.delete(id);
      }
    }

    // Add or update visible nodes
    Object.values(nodes).forEach(node => {
      if (!node.visible) return;
      const existing = this.instanceMap.get(node.schemaRef.id);

      if (!existing) {
        const rect = new Rect(this.toRectProps(node.schemaRef));
        this.root.add(rect);
        this.instanceMap.set(node.schemaRef.id, rect);
        return;
      }

      existing.set(this.toRectProps(node.schemaRef));
    });
  }

  private toRectProps(schema: NodeSchemaType) {
    const width = schema.size?.width ?? 0;
    const height = schema.size?.height ?? 0;
    const { x, y } = schema.position;
    const fill = (schema.props as { fill?: string } | undefined)?.fill;

    return { x, y, width, height, fill };
  }
}


