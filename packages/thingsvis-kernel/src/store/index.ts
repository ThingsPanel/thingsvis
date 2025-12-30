import type { Page, Node } from "@thingsvis/schema";

type Patch = { nodeId: string; patch: Partial<Node> };

// Minimal EventEmitter replacement to avoid bundler/node-core polyfills during browser-targeted builds.
class TinyEmitter {
  private handlers: Record<string, Set<Function>> = {};

  on(event: string, fn: Function) {
    this.handlers[event] = this.handlers[event] || new Set();
    this.handlers[event].add(fn);
  }
  off(event: string, fn: Function) {
    if (!this.handlers[event]) return;
    this.handlers[event].delete(fn);
  }
  emit(event: string, ...args: any[]) {
    if (!this.handlers[event]) return;
    for (const fn of Array.from(this.handlers[event])) {
      try {
        fn(...args);
      } catch (e) {
        // swallow handler errors for now
        // eslint-disable-next-line no-console
        console.warn("[TinyEmitter] handler error", e);
      }
    }
  }
}

const emitter = new TinyEmitter();

// In-memory simple store for kernel (MVP). Later replaced by Zustand/Immer store.
const pages: Record<string, Page> = {};

export function getPage(pageId: string): Page | null {
  return pages[pageId] ?? null;
}

export const action = {
  addNode(pageId: string, node: Node) {
    const page = pages[pageId] || { id: pageId, mode: "Fixed", nodes: [], meta: {} } as Page;
    page.nodes = page.nodes.concat([node]);
    pages[pageId] = page;
    emitter.emit("patches", [{ nodeId: node.id, patch: node } as Patch]);
    return { nodeId: node.id };
  },
  updateNode(pageId: string, nodeId: string, patch: Partial<Node>) {
    const page = pages[pageId];
    if (!page) return { success: false };
    const idx = page.nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return { success: false };
    page.nodes[idx] = { ...page.nodes[idx], ...patch } as Node;
    emitter.emit("patches", [{ nodeId, patch } as Patch]);
    return { success: true };
  },
  removeNode(pageId: string, nodeId: string) {
    const page = pages[pageId];
    if (!page) return { success: false };
    page.nodes = page.nodes.filter((n) => n.id !== nodeId);
    emitter.emit("patches", [{ nodeId, patch: { id: nodeId } } as Patch]);
    return { success: true };
  },
  setSelection(pageId: string, ids: string[]) {
    emitter.emit("selection", { pageId, ids });
    return { success: true };
  },
  groupNodes(pageId: string, nodeIds: string[], groupId?: string) {
    // Minimal implementation: attach groupId to members
    const page = pages[pageId];
    if (!page) return { groupId: "" };
    const gid = groupId || `group-${Date.now()}`;
    page.nodes.forEach((n) => {
      if (nodeIds.includes(n.id)) n.groupId = gid;
    });
    emitter.emit("patches", nodeIds.map((id) => ({ nodeId: id, patch: { groupId: gid } } as Patch)));
    return { groupId: gid };
  },
  ungroup(pageId: string, groupId: string) {
    const page = pages[pageId];
    if (!page) return { success: false };
    page.nodes.forEach((n) => {
      if (n.groupId === groupId) delete n.groupId;
    });
    emitter.emit("patches", [{ nodeId: groupId, patch: {} } as Patch]);
    return { success: true };
  },
};

export function subscribeToPatches(callback: (patches: Patch[]) => void) {
  const handler = (patches: Patch[]) => callback(patches);
  emitter.on("patches", handler);
  return () => {
    emitter.off("patches", handler);
  };
}


