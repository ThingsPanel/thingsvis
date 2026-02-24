# Data Model: Canvas Kernel

## Entity: PageSchema
- id: string
- title: string
- mode: "Fixed" | "Infinite" | "Reflow"
- width: number (px) — for Fixed mode
- height: number (px) — for Fixed mode
- layoutRules: object (Reflow rules)
- nodes: Node[]
- meta: Record<string, any>

## Entity: Node (Component Instance)
- id: string
- widgetId: string
- props: Record<string, any> (plugin config)
- x: number
- y: number
- width: number
- height: number
- rotation: number
- scaleX: number
- scaleY: number
- transform3D?: { rx?:number, ry?:number, rz?:number, perspective?:number }
- zIndex: number
- visible: boolean
- groupId?: string
- dirty?: boolean

## Entity: SelectionState
- selectedIds: string[]
- primarySelectionId?: string
- selectionBounds?: { x,y,width,height }
- transformHandle: { mode: "translate"|"scale"|"rotate"|"skew" }

## Entity: Group
- id: string
- memberIds: string[]
- invariant: relative offsets stored for group transforms

## Entity: ErrorBoundaryContext
- widgetId: string
- nodeId: string
- error?: { message:string, stack?:string, time:number }
- fallbackUI?: Record<string, any>

## Validation
- All public shapes MUST be defined in `packages/thingsvis-schema` as Zod schemas prior to implementation.
- Use Zod to validate ETL outputs before injecting into store.


