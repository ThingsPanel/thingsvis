# data-model.md — Dual Canvas Modes

## Entities

1. **CanvasState**
   - id: string
   - mode: `"fixed" | "infinite"`
   - width: number (px, default 1920)
   - height: number (px, default 1080)
   - gridSize: number (px, default 16)
   - offsetX: number (px) — for infinite pan
   - offsetY: number (px)
   - scale: number (float, default 1.0)
   - centeredMask: boolean (Fixed mode: show mask)

2. **Node**
   - id: string (uuid)
   - type: string (component key from registry)
   - props: object (component props validated via PropsSchema)
   - transform: Transform
   - meta: { createdAt, createdBy }

3. **Transform**
   - x: number
   - y: number
   - width: number
   - height: number
   - rotation: number (degrees)
   - zIndex: number

4. **RegistryEntry**
   - key: string
   - displayName: string
   - PropsSchema: Zod schema (exported shape)
   - defaultProps: object
   - renderer: dynamic module reference (loaded via MF or runtime registry)

5. **Command (Cmd)**
   - id: string
   - type: string (`move` | `resize` | `rotate` | `add` | `remove` | `props:update`)
   - payload: object
   - do(): apply
   - undo(): revert

## Relationships

- `CanvasState` contains many `Node`s.  
- `CmdStack` stores an ordered list of `Command` objects affecting nodes/canvas.  
- `Registry` provides `RegistryEntry` objects used to instantiate `Node`s.

## Validation Rules

- `Node.props` must validate against `RegistryEntry.PropsSchema` (Zod) before being accepted into the store.  
- `Transform` width/height must be > 0.  
- `CanvasState.scale` must be bounded (e.g., 0.1 — 10).

## State Transitions

- `add node` → push `add` Command → node appears in `nodes` and selection updated.  
- `move/resize/rotate` → push `transform` Command(s) with before/after states.  
- `undo` → pop last Command and call undo(), update store.  
- `redo` → re-apply previously undone Command via redo queue.


