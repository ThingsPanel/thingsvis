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
        this.attachInteractionHandlers(rect, node);
        return;
      }

      existing.set(this.toRectProps(node.schemaRef));
    });
  }

  private attachInteractionHandlers(rect: Rect, node: NodeState) {
    const nodeId = node.id;

    // Selection on click/tap
    rect.on('tap', () => {
      const { selectNode } = this.store.getState();
      if (selectNode) {
        selectNode(nodeId);
      }
    });

    // Persist final position on drag end to kernel store
    rect.on('drag.end', () => {
      const { updateNode } = this.store.getState() as KernelState & {
        updateNode?: (id: string, changes: { position?: { x: number; y: number } }) => void;
      };
      if (!updateNode) return;
      const { x, y } = rect;
      updateNode(nodeId, { position: { x, y } });
    });
  }

  private toRectProps(schema: NodeSchemaType) {
    const width = schema.size?.width ?? 0;
    const height = schema.size?.height ?? 0;
    const { x, y } = schema.position;
    const fill = (schema.props as { fill?: string } | undefined)?.fill;

    return {
      x,
      y,
      width,
      height,
      fill,
      draggable: true,
      cursor: 'pointer'
    };
  }
}


