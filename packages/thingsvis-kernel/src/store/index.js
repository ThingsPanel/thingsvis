// Minimal EventEmitter replacement to avoid bundler/node-core polyfills during browser-targeted builds.
class TinyEmitter {
    constructor() {
        this.handlers = {};
    }
    on(event, fn) {
        this.handlers[event] = this.handlers[event] || new Set();
        this.handlers[event].add(fn);
    }
    off(event, fn) {
        if (!this.handlers[event])
            return;
        this.handlers[event].delete(fn);
    }
    emit(event, ...args) {
        if (!this.handlers[event])
            return;
        for (const fn of Array.from(this.handlers[event])) {
            try {
                fn(...args);
            }
            catch (e) {
                // swallow handler errors for now
                // eslint-disable-next-line no-console
                
            }
        }
    }
}
const emitter = new TinyEmitter();
// In-memory simple store for kernel (MVP). Later replaced by Zustand/Immer store.
const pages = {};
export function getPage(pageId) {
    return pages[pageId] ?? null;
}
export const action = {
    addNode(pageId, node) {
        const page = pages[pageId] || { id: pageId, mode: "Fixed", nodes: [], meta: {} };
        page.nodes = page.nodes.concat([node]);
        pages[pageId] = page;
        emitter.emit("patches", [{ nodeId: node.id, patch: node }]);
        return { nodeId: node.id };
    },
    updateNode(pageId, nodeId, patch) {
        const page = pages[pageId];
        if (!page)
            return { success: false };
        const idx = page.nodes.findIndex((n) => n.id === nodeId);
        if (idx === -1)
            return { success: false };
        page.nodes[idx] = { ...page.nodes[idx], ...patch };
        emitter.emit("patches", [{ nodeId, patch }]);
        return { success: true };
    },
    removeNode(pageId, nodeId) {
        const page = pages[pageId];
        if (!page)
            return { success: false };
        page.nodes = page.nodes.filter((n) => n.id !== nodeId);
        emitter.emit("patches", [{ nodeId, patch: { id: nodeId } }]);
        return { success: true };
    },
    setSelection(pageId, ids) {
        emitter.emit("selection", { pageId, ids });
        return { success: true };
    },
    groupNodes(pageId, nodeIds, groupId) {
        // Minimal implementation: attach groupId to members
        const page = pages[pageId];
        if (!page)
            return { groupId: "" };
        const gid = groupId || `group-${Date.now()}`;
        page.nodes.forEach((n) => {
            if (nodeIds.includes(n.id))
                n.groupId = gid;
        });
        emitter.emit("patches", nodeIds.map((id) => ({ nodeId: id, patch: { groupId: gid } })));
        return { groupId: gid };
    },
    ungroup(pageId, groupId) {
        const page = pages[pageId];
        if (!page)
            return { success: false };
        page.nodes.forEach((n) => {
            if (n.groupId === groupId)
                delete n.groupId;
        });
        emitter.emit("patches", [{ nodeId: groupId, patch: {} }]);
        return { success: true };
    },
};
export function subscribeToPatches(callback) {
    const handler = (patches) => callback(patches);
    emitter.on("patches", handler);
    return () => {
        emitter.off("patches", handler);
    };
}
