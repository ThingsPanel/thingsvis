# Data Model: Editor Core Features

**Feature**: 010-editor-core-features  
**Date**: 2026-01-06

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Storage Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   localStorage                        IndexedDB                      │
│   ┌──────────────────┐               ┌──────────────────────────┐   │
│   │ RecentProjects   │               │ projects (store)          │   │
│   │ ────────────────│               │ ─────────────────────────│   │
│   │ id: string       │  references  │ id: string (key)          │   │
│   │ name: string     │──────────────▶│ data: ProjectFile         │   │
│   │ thumbnail: string│               └──────────────────────────┘   │
│   │ updatedAt: number│                                              │
│   └──────────────────┘                                              │
│          ▲                                                          │
│          │ max 20 entries                                           │
│          │                                                          │
└──────────┼──────────────────────────────────────────────────────────┘
           │
           │ sync on save
           │
┌──────────┴──────────────────────────────────────────────────────────┐
│                         Runtime State                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────┐     ┌──────────────────┐                     │
│   │ SaveState        │     │ CommandRegistry  │                     │
│   │ ────────────────│     │ ────────────────│                     │
│   │ isDirty: boolean │     │ commands: Map    │                     │
│   │ lastSavedAt: num │     │                  │                     │
│   │ saveStatus: enum │     │ register()       │                     │
│   └──────────────────┘     │ execute()        │                     │
│          │                 │ getAll()         │                     │
│          │                 └──────────────────┘                     │
│          ▼                          │                               │
│   ┌──────────────────┐              │                               │
│   │ AutoSaveManager  │              ▼                               │
│   │ ────────────────│     ┌──────────────────┐                     │
│   │ debounceTimer    │     │ Command          │                     │
│   │ periodicTimer    │     │ ────────────────│                     │
│   │                  │     │ id: string       │                     │
│   │ scheduleDebounce │     │ label: string    │                     │
│   │ saveNow()        │     │ shortcut: string │                     │
│   │ markDirty()      │     │ category: enum   │                     │
│   └──────────────────┘     │ execute: fn      │                     │
│                            └──────────────────┘                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### 1. ProjectFile (Persistence)

The `.thingsvis` file format for export/import and IndexedDB storage.

```typescript
interface ProjectFile {
  meta: ProjectMeta
  canvas: CanvasConfig
  nodes: NodeSchemaType[]      // From @thingsvis/schema
  dataSources: DataSourceConfig[]
}

interface ProjectMeta {
  version: '1.0.0'             // File format version
  id: string                   // UUID v4
  name: string                 // User-defined name
  createdAt: number            // Unix timestamp (ms)
  updatedAt: number            // Unix timestamp (ms)
  thumbnail?: string           // Base64 JPEG, max 50KB
}

interface CanvasConfig {
  mode: 'fixed' | 'infinite' | 'reflow'
  width: number
  height: number
  background: string           // CSS color
  gridEnabled?: boolean
  gridSize?: number
}

interface DataSourceConfig {
  id: string
  type: string
  config: Record<string, unknown>
}
```

**Validation rules**:
- `meta.version` must be semver format
- `meta.id` must be valid UUID
- `meta.name` must be 1-100 characters
- `canvas.width/height` must be positive integers
- `nodes` must pass NodeSchema validation

**State transitions**:
- New project: Create with default meta, empty nodes
- Edit: Update nodes/canvas, set `meta.updatedAt`
- Save: Persist entire ProjectFile to IndexedDB
- Export: Serialize ProjectFile to JSON blob
- Import: Parse JSON, validate, load into store

---

### 2. RecentProjectEntry (Metadata Cache)

Lightweight metadata for recent projects list in localStorage.

```typescript
interface RecentProjectEntry {
  id: string                   // Project UUID
  name: string                 // Display name
  thumbnail: string            // Base64 JPEG thumbnail (128x72)
  updatedAt: number            // For sorting
}

type RecentProjectsList = RecentProjectEntry[]  // Max 20 entries
```

**Validation rules**:
- List is sorted by `updatedAt` descending
- List is capped at 20 entries
- Oldest entry removed when adding 21st
- Thumbnail is max 50KB base64 string

---

### 3. Command (Runtime)

Registered command for keyboard shortcuts and toolbar actions.

```typescript
interface Command {
  id: string                   // Unique ID, e.g., 'editor.save'
  label: string                // Display name in English
  labelZh?: string             // Display name in Chinese
  shortcut?: ShortcutKey[]     // Key combination
  category: CommandCategory
  icon?: React.ComponentType
  when?: () => boolean         // Enable condition
  execute: () => void | Promise<void>
}

type ShortcutKey = 
  | 'mod'      // Ctrl on Win, ⌘ on Mac
  | 'ctrl'
  | 'shift'
  | 'alt'
  | 'meta'
  | string     // Single character or key name

type CommandCategory = 
  | 'tool'     // V, R, T, H
  | 'edit'     // Undo, redo, copy, paste
  | 'view'     // Zoom, pan
  | 'project'  // Save, open, export
  | 'help'     // Shortcuts panel
```

**Built-in commands**:

| ID | Shortcut | Category | Label |
|----|----------|----------|-------|
| `tool.select` | V | tool | Select |
| `tool.rectangle` | R | tool | Rectangle |
| `tool.text` | T | tool | Text |
| `tool.pan` | H | tool | Pan |
| `edit.undo` | mod+Z | edit | Undo |
| `edit.redo` | mod+Y | edit | Redo |
| `project.save` | mod+S | project | Save |
| `project.open` | mod+O | project | Open |
| `project.preview` | mod+P | project | Preview |
| `help.shortcuts` | ? | help | Shortcuts |

---

### 4. SaveState (Runtime)

Tracks save status for UI feedback.

```typescript
interface SaveState {
  status: SaveStatus
  lastSavedAt: number | null   // Timestamp of last successful save
  error: string | null         // Error message if save failed
}

type SaveStatus = 
  | 'idle'       // No unsaved changes
  | 'dirty'      // Has unsaved changes
  | 'saving'     // Save in progress
  | 'saved'      // Just saved (briefly shown)
  | 'error'      // Save failed
```

**State machine**:
```
idle ──onChange──▶ dirty ──autoSave──▶ saving ──success──▶ saved ──(1s)──▶ idle
                     │                    │
                     │                    ▼
                     │                  error ──retry──▶ saving
                     │
                     ▼
                  (Ctrl+S)
                     │
                     ▼
                  saving
```

---

### 5. PreviewSession (Runtime)

One-time session for secure preview data transfer.

```typescript
interface PreviewSession {
  token: string                // UUID, one-time use
  projectId: string            // Project to load
  createdAt: number            // For expiry (5 min TTL)
}

// Storage key: sessionStorage['thingsvis:preview-session']
```

**Lifecycle**:
1. Studio creates session, stores in sessionStorage
2. Preview reads token from URL, retrieves session
3. Preview deletes session after reading (one-time)
4. Stale sessions (>5 min) are ignored

---

## Zod Schemas

```typescript
// apps/studio/src/lib/storage/schemas.ts

import { z } from 'zod'

export const ProjectMetaSchema = z.object({
  version: z.literal('1.0.0'),
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  thumbnail: z.string().max(70000).optional(), // ~50KB base64
})

export const CanvasConfigSchema = z.object({
  mode: z.enum(['fixed', 'infinite', 'reflow']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  background: z.string(),
  gridEnabled: z.boolean().optional(),
  gridSize: z.number().int().positive().optional(),
})

export const DataSourceConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  config: z.record(z.unknown()),
})

// Note: NodeSchema comes from @thingsvis/schema
export const ProjectFileSchema = z.object({
  meta: ProjectMetaSchema,
  canvas: CanvasConfigSchema,
  nodes: z.array(z.any()), // Validated separately with NodeSchema
  dataSources: z.array(DataSourceConfigSchema),
})

export const RecentProjectEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  thumbnail: z.string(),
  updatedAt: z.number(),
})

export type ProjectFile = z.infer<typeof ProjectFileSchema>
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>
export type RecentProjectEntry = z.infer<typeof RecentProjectEntrySchema>
```

---

## Storage Layout

### IndexedDB

| Store | Key | Value | Purpose |
|-------|-----|-------|---------|
| `projects` | `projectId` (string) | `ProjectFile` | Full project data |

### localStorage

| Key | Value | Purpose |
|-----|-------|---------|
| `thingsvis:recent-projects` | `RecentProjectEntry[]` JSON | Quick access to recent list |

### sessionStorage

| Key | Value | Purpose |
|-----|-------|---------|
| `thingsvis:preview-session` | `PreviewSession` JSON | One-time preview auth |
