/**
 * LeaferAdapter
 *
 * Minimal adapter skeleton to mount Leafer Viewport and manage node primitives.
 * This file provides imperative methods used by VisualEngine to keep React out of per-frame updates.
 */
export class LeaferAdapter {
  private viewport: any = null;
  private nodes: Map<string, any> = new Map();

  init(viewportEl: HTMLDivElement) {
    // Lazy-load Leafer to avoid bundling in server contexts.
    // eslint-disable-next-line no-console
    console.log("[LeaferAdapter] init", viewportEl);
    // TODO: Initialize actual Leafer Viewport instance here.
    this.viewport = { el: viewportEl };
  }

  addNode(nodeId: string, renderSpec: any) {
    // Create a visual primitive for the node and attach to viewport
    // eslint-disable-next-line no-console
    console.log("[LeaferAdapter] addNode", nodeId, renderSpec);
    const primitive = { id: nodeId, spec: renderSpec };
    this.nodes.set(nodeId, primitive);
    // attach to viewport
  }

  removeNode(nodeId: string) {
    // eslint-disable-next-line no-console
    console.log("[LeaferAdapter] removeNode", nodeId);
    this.nodes.delete(nodeId);
  }

  updateNodeTransform(nodeId: string, transform: { x: number; y: number; rotation?: number; scale?: { x: number; y: number } }) {
    // eslint-disable-next-line no-console
    console.log("[LeaferAdapter] updateNodeTransform", nodeId, transform);
    const node = this.nodes.get(nodeId);
    if (!node) return;
    node.transform = transform;
  }
}

export default LeaferAdapter;


