# Contract: Plugin Registry & Drop Command

## Purpose

Define the contract between the Editor (L2), Kernel (L0), and plugin loader (L1) for registry lookup, dynamic loading and the Drop Command.

## API: Registry Loader

- getRegistryEntries(): Promise<ComponentRegistryEntry[]>
  - Input: optional URL override
  - Output: validated array of `ComponentRegistryEntry`

- loadPlugin(remoteEntryUrl: string, exposedModule: string): Promise<PluginModule>
  - The loader returns a module factory that can be executed inside `SafeExecutor`.

## Kernel Command: node.drop

- Command Type: `node.drop`
- Payload:
  - nodeId: string
  - componentType: string (remoteName)
  - initialProps: Record<string, unknown>
  - position: { x: number; y: number } (world coordinates)
  - meta: { source: "dnd" | "insert" }

- Behavior:
  - `execute(state)`: insert node into `nodesById`, update page schema, set selection to new node, push to history
  - `undo(state)`: remove node from `nodesById`, restore previous selection and page schema

## Events

- `event:plugin.load.start` { remoteName, remoteEntryUrl }
- `event:plugin.load.success` { remoteName, moduleInfo }
- `event:plugin.load.failure` { remoteName, error }
- `event:node.created` { nodeId, componentType }


