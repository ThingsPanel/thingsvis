# Contract: Kernel Actions (L0 API)

This contract defines the methods available on the `KernelStore` to mutate state. These are used by the Studio (L2) to perform edits.

## Interface: `KernelActions`

### `loadPage(page: PageSchemaType): void`
Loads a complete page schema into the store. Clears history and selection.

### `addNodes(nodes: NodeSchemaType[]): void`
Adds one or more nodes to the page. If a node with the same ID exists, it is updated.

### `updateNode(nodeId: string, changes: NodeChanges): void`
Updates a specific node.
- `NodeChanges`: `{ position?: { x, y }, size?: { width, height }, props?: Record<string, any> }`

### `selectNode(nodeId: string | null): void`
Sets the current selection. Passing `null` clears the selection.

### `setNodeError(nodeId: string, error: string): void`
Marks a node with an error state (used by VisualEngine to report rendering failures).

## Event Bus
The Kernel also exposes an `EventBus` for non-stateful notifications:
- `plugin.load.start`
- `plugin.load.success`
- `plugin.load.error`
- `interaction.drag.start`
- `interaction.drag.end`

