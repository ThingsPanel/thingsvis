import type { Page, Node } from "@thingsvis/schema";
type Patch = {
    nodeId: string;
    patch: Partial<Node>;
};
export declare function getPage(pageId: string): Page | null;
export declare const action: {
    addNode(pageId: string, node: Node): {
        nodeId: string;
    };
    updateNode(pageId: string, nodeId: string, patch: Partial<Node>): {
        success: boolean;
    };
    removeNode(pageId: string, nodeId: string): {
        success: boolean;
    };
    setSelection(pageId: string, ids: string[]): {
        success: boolean;
    };
    groupNodes(pageId: string, nodeIds: string[], groupId?: string): {
        groupId: string;
    };
    ungroup(pageId: string, groupId: string): {
        success: boolean;
    };
};
export declare function subscribeToPatches(callback: (patches: Patch[]) => void): () => void;
export {};
//# sourceMappingURL=index.d.ts.map