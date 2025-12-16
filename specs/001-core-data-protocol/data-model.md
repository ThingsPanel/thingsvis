# Data Model: Core Data Protocol

**Feature**: Core Data Protocol and Kernel Interfaces  
**Date**: 2025-01-27  
**Phase**: 1 - Design & Contracts

## Entity Relationships

```
Page
├── Meta (id, version, name, scope)
├── Config (mode, width, height, theme)
└── Content
    └── nodes: VisualComponent[]
        ├── Identity (id, type, name, locked, hidden)
        ├── Transform (x, y, width, height, rotation)
        ├── Data (sourceId, topic, transform)
        ├── Props (Record<string, unknown>)
        └── Events (trigger, action, payload)[]
```

## Entity Definitions

### Page

**Purpose**: Represents a complete visualization page configuration.

**Fields**:
- **Meta** (`PageMeta`):
  - `id`: UUID v4 string (required) - Unique identifier for the page
  - `version`: String (required, default: "1.0.0") - Schema version for compatibility
  - `name`: String (required) - Human-readable page name
  - `scope`: Enum `'app' | 'template'` (required) - Page scope classification

- **Config** (`PageConfig`):
  - `mode`: Enum `'fixed' | 'infinite' | 'reflow'` (required) - Page layout mode
  - `width`: Number (required, default: 1920) - Page width in pixels
  - `height`: Number (required, default: 1080) - Page height in pixels
  - `theme`: Enum `'dark' | 'light' | 'auto'` (required) - Visual theme preference

- **Content**:
  - `nodes`: Array of `VisualComponent` (required, default: []) - Visual components on the page

**Validation Rules**:
- `id` must be valid UUID v4 format
- `version` defaults to "1.0.0" if not provided
- `scope` must be exactly 'app' or 'template'
- `mode` must be exactly 'fixed', 'infinite', or 'reflow'
- `width` and `height` must be positive numbers (>= 1)
- `theme` must be exactly 'dark', 'light', or 'auto'
- `nodes` array can be empty but must be an array

**Relationships**:
- Contains zero or more `VisualComponent` instances in `nodes` array
- No parent entity (top-level entity)

**State Transitions**: N/A (immutable data structure)

### VisualComponent

**Purpose**: Represents a single visual element within a page.

**Fields**:
- **Identity** (`ComponentIdentity`):
  - `id`: UUID v4 string (required) - Unique identifier for the component
  - `type`: String (required) - Component type identifier (e.g., 'echarts-bar')
  - `name`: String (required) - Human-readable component name
  - `locked`: Boolean (required, default: false) - Whether component is locked from editing
  - `hidden`: Boolean (required, default: false) - Whether component is hidden from display

- **Transform** (`ComponentTransform`):
  - `x`: Number (required) - X position in pixels
  - `y`: Number (required) - Y position in pixels
  - `width`: Number (required) - Component width in pixels
  - `height`: Number (required) - Component height in pixels
  - `rotation`: Number (required, default: 0) - Rotation in degrees (0-360)

- **Data** (`ComponentData`):
  - `sourceId`: String (required) - Data source identifier
  - `topic`: String (required) - Data topic/subscription identifier
  - `transform`: String (required) - Transform script as string

- **Props** (`ComponentProps`):
  - `props`: Record<string, unknown> (required, default: {}) - Component-specific configuration

- **Events** (`ComponentEvents`):
  - `events`: Array of event objects (required, default: [])
    - `trigger`: String (required) - Event trigger identifier
    - `action`: String (required) - Action to execute
    - `payload`: Unknown (required) - Action payload data

**Validation Rules**:
- `id` must be valid UUID v4 format
- `type` must be non-empty string
- `name` must be non-empty string
- `locked` and `hidden` default to `false` if not provided
- `x`, `y`, `width`, `height` must be numbers (can be negative for positioning)
- `rotation` defaults to 0 if not provided, should be 0-360 range
- `sourceId` and `topic` must be non-empty strings
- `transform` must be a string (can be empty)
- `props` defaults to empty object `{}` if not provided
- `events` array defaults to empty array `[]` if not provided
- Each event object must have `trigger`, `action`, and `payload` fields

**Relationships**:
- Belongs to a `Page` via `nodes` array
- No child entities

**State Transitions**: N/A (immutable data structure)

## Validation Rules Summary

### Page Validation
1. ✅ All required fields present (id, version, name, scope, mode, width, height, theme, nodes)
2. ✅ `id` is valid UUID v4 format
3. ✅ `version` defaults to "1.0.0" if missing
4. ✅ `scope` is one of: 'app', 'template'
5. ✅ `mode` is one of: 'fixed', 'infinite', 'reflow'
6. ✅ `width` and `height` are positive numbers
7. ✅ `theme` is one of: 'dark', 'light', 'auto'
8. ✅ `nodes` is an array (can be empty)

### Component Validation
1. ✅ All required fields present (id, type, name, x, y, width, height, sourceId, topic, transform)
2. ✅ `id` is valid UUID v4 format
3. ✅ `type` and `name` are non-empty strings
4. ✅ `locked` and `hidden` default to `false` if missing
5. ✅ Transform values (x, y, width, height, rotation) are numbers
6. ✅ `rotation` defaults to 0 if missing
7. ✅ `sourceId` and `topic` are non-empty strings
8. ✅ `transform` is a string
9. ✅ `props` defaults to `{}` if missing
10. ✅ `events` is an array (can be empty)
11. ✅ Each event has `trigger`, `action`, and `payload` fields

## Error Handling

### Schema Validation Errors
- Missing required fields → Clear error message indicating which field is missing
- Invalid UUID format → Error message: "Invalid UUID format for field 'id'"
- Invalid enum value → Error message: "Invalid value for field 'scope'. Expected one of: 'app', 'template'"
- Invalid type → Error message: "Expected number for field 'width', received string"
- Invalid array element → Error message indicating which index failed validation

### Edge Cases
- Empty arrays are valid (empty `nodes` or `events`)
- Negative transform values are allowed (for positioning outside viewport)
- Rotation values outside 0-360 range are allowed (will be normalized by renderer)
- Empty strings for `transform` script are allowed (no-op transform)
- Empty `props` object is valid (component uses defaults)

## Type Inference

All types are automatically inferred from Zod schemas using `z.infer<typeof Schema>`:

- `IPage` = `z.infer<typeof PageSchema>`
- `IVisualComponent` = `z.infer<typeof VisualComponentSchema>`
- `IPageMeta` = `z.infer<typeof PageMetaSchema>`
- `IPageConfig` = `z.infer<typeof PageConfigSchema>`
- `IComponentIdentity` = `z.infer<typeof ComponentIdentitySchema>`
- `IComponentTransform` = `z.infer<typeof ComponentTransformSchema>`
- `IComponentData` = `z.infer<typeof ComponentDataSchema>`
- `IComponentProps` = `z.infer<typeof ComponentPropsSchema>`
- `IComponentEvent` = `z.infer<typeof ComponentEventSchema>`

