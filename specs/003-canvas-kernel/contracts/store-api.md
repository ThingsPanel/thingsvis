# Contract: Kernel Store API (public surface for VisualEngine & Plugins)

## Read APIs
- getPage(pageId: string): PageSchema | null
- queryNodes(filter: { inViewport?: boolean, tag?: string, ids?: string[] }): Node[]
- getSelection(): SelectionState

## Mutation APIs (via typed actions)
- action.addNode(pageId: string, node: Node): { nodeId: string }
- action.updateNode(pageId: string, nodeId: string, patch: Partial<Node>): { success: boolean }
- action.removeNode(pageId: string, nodeId: string): { success: boolean }
- action.setSelection(pageId: string, ids: string[]): { success: boolean }
- action.groupNodes(pageId: string, nodeIds: string[], groupId?: string): { groupId: string }
- action.ungroup(pageId: string, groupId: string): { success: boolean }

## Subscription
- subscribeToPatches(callback: (patches: any[]) => void): Unsubscribe
- subscribeToNode(nodeId: string, callback: (node: Node) => void): Unsubscribe

## Notes
- All mutations MUST validate inputs using Zod schemas.  
- Actions are the only approved way to mutate store state; direct mutation is forbidden.


