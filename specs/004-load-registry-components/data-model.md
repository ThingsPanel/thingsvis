# Data Model: Registry load, CanvasInstance, Command, CanvasState

## Entities

- ComponentRegistryEntry
  - remoteName: string
  - remoteEntryUrl: string
  - exposedModule: string
  - version?: string
  - displayName?: string
  - iconUrl?: string

- CanvasConfig
  - id: string
  - mode: "fixed" | "infinite" | "reflow"
  - width?: number
  - height?: number
  - gridSize?: number
  - zoom: number
  - offsetX: number
  - offsetY: number

- CanvasInstance (node)
  - id: string
  - type: string (component remoteName or local type)
  - position: { x: number; y: number } (world coordinates)
  - rotation?: number
  - scale?: { x: number; y: number }
  - props: Record<string, unknown>

- Command (kernel)
  - id: string
  - type: string
  - payload: unknown
  - execute(state: KernelState): KernelState
  - undo(state: KernelState): KernelState

- KernelState (excerpt)
  - page: PageSchema
  - nodesById: Record<string, CanvasInstance>
  - canvas: CanvasConfig
  - selection: { nodeIds: string[] }
  - history: { past: Command[]; future: Command[] }

## Validation Contracts

- `registry.json` entries MUST match `ComponentRegistryEntry` shape; optional fields may be omitted but loader must validate using Zod schemas from `packages/thingsvis-schema`.
- `CanvasInstance.position` is stored in world coordinates; transforms between screen and world must use shared helper.

## Notes

- Keep kernel types minimal and put Zod shapes in `packages/thingsvis-schema` for reuse across apps and tests.

