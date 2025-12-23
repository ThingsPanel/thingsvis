# Data Model: Studio–Kernel Integration

## Entities

### 1. Project (Kernel State)
The top-level state managed by the Kernel.
- `id`: string (UUID)
- `name`: string
- `mode`: "fixed" | "infinite" | "reflow"
- `canvas`: { width, height, zoom, offsetX, offsetY }
- `nodesById`: Record<string, NodeState>
- `selection`: { nodeIds: string[] }

### 2. NodeState
Internal representation of a component instance in the Kernel.
- `id`: string
- `type`: string (plugin identifier)
- `schemaRef`: NodeSchemaType (position, size, rotation, props)
- `visible`: boolean
- `locked`: boolean
- `error?`: string (non-fatal error message)

### 3. Command
Atomic state change unit for Undo/Redo.
- `type`: "node.add" | "node.remove" | "node.move" | "node.transform" | "selection.change"
- `payload`: any
- `timestamp`: number

## Relationships
- **Project 1:N NodeState**: A project contains many nodes.
- **NodeState 1:1 Plugin**: Each node type corresponds to a remote plugin loaded via MF2.
- **NodeState 1:1 MoveableProxy**: (UI Layer) Each node has a corresponding proxy for interaction.

## Validation Rules
- Node positions must be finite numbers.
- `fixed` mode requires `width` and `height` to be > 0.
- Plugin types must exist in `registry.json` or fallback to `errorRenderer`.

