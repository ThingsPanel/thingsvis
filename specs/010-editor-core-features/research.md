# Research: Editor Core Features

**Feature**: 010-editor-core-features  
**Date**: 2026-01-06  
**Status**: Complete

---

## Decision 1: Save Conflict Resolution Strategy

**Context**: Auto-save (1s debounce) and manual save (Ctrl+S) may overlap. Need to prevent race conditions and data corruption.

**Decision**: **Debounce Reset + Immediate Execute**

When Ctrl+S is pressed:
1. Cancel any pending debounced auto-save timer
2. Execute save immediately with current state
3. Reset the 10-second periodic check timer

This is simpler than mutex locking and matches user intent (manual save = "save now").

**Rationale**:
- User explicitly pressing Ctrl+S expects immediate save
- Canceling pending auto-save prevents duplicate writes
- No complex mutex/queue logic needed
- Matches Excalidraw's approach

**Alternatives considered**:
- Mutex with queue: Over-engineered for single-user local storage
- Cancel and replace: Risk of losing in-flight data
- Last-write-wins: Acceptable for IndexedDB but debounce reset is cleaner

---

## Decision 2: Preview Data Transfer Mechanism

**Context**: Preview opens in new tab. Need to pass project data securely without exposing in URL.

**Decision**: **postMessage + One-Time Session Token**

Flow:
1. Studio saves project to IndexedDB
2. Studio generates a random session token (UUID)
3. Studio stores `{ token, projectId, timestamp }` in sessionStorage
4. Studio opens preview with `?session=<token>`
5. Preview reads token from URL, retrieves projectId from sessionStorage
6. Preview loads project from IndexedDB
7. Session token is deleted after use (one-time)

**Rationale**:
- Project data stays in IndexedDB (not in URL or postMessage payload)
- Token prevents unauthorized access to projects
- sessionStorage is tab-scoped, automatically cleaned up
- No encryption needed since data never leaves browser storage

**Alternatives considered**:
- URL hash with base64: Exposes data in browser history, length limits
- postMessage only: Requires keeping opener reference, complex lifecycle
- Encrypted token: Overkill for local-only storage

**Security considerations**:
- Token expires after 5 minutes (stale session cleanup)
- Token is single-use (deleted after preview loads)
- Cross-origin blocked by sessionStorage scope

---

## Decision 3: Keyboard Shortcut Browser Conflict Handling

**Context**: Shortcuts like Ctrl+P (browser print), Ctrl+S (browser save) conflict with editor actions.

**Decision**: **preventDefault + Platform-Aware Key Display**

Implementation:
1. Call `e.preventDefault()` for all registered shortcuts
2. Use `e.stopPropagation()` to prevent bubbling
3. Detect platform for display: Mac shows ⌘, Windows shows Ctrl
4. Store shortcuts as abstract `['mod', 's']` where `mod` = Ctrl/⌘

**Rationale**:
- Standard pattern used by Figma, Excalidraw, VS Code
- Users expect editor shortcuts to override browser defaults
- Platform-aware display improves UX

**Browser-specific notes**:
- Ctrl+P: Fully blockable with preventDefault
- Ctrl+S: Fully blockable with preventDefault
- Ctrl+W (close tab): NOT blockable, avoid using
- F5 (refresh): NOT blockable in some browsers, avoid using

**Shortcuts to avoid** (cannot override):
- Ctrl+W, Ctrl+T, Ctrl+N (browser tab/window management)
- F5, Ctrl+R (refresh - partially blockable)
- Alt+F4 (OS-level)

---

## Decision 4: Project File Format Structure

**Context**: Need a versioned, extensible file format for `.thingsvis` files.

**Decision**: **JSON with versioned schema**

```typescript
interface ThingsVisProjectFile {
  meta: {
    version: '1.0.0'       // File format version
    name: string
    createdAt: number      // Unix timestamp
    updatedAt: number
    thumbnail?: string     // Base64 PNG for recent projects list
  }
  canvas: {
    mode: 'fixed' | 'infinite' | 'reflow'
    width: number
    height: number
    background: string
  }
  nodes: NodeSchemaType[]  // Existing schema from @thingsvis/schema
  dataSources: DataSourceConfig[]
}
```

**Rationale**:
- JSON is human-readable, debuggable, diffable
- Version field enables future migrations
- Matches existing PageSchema structure
- Zod validation ensures import safety

**Alternatives considered**:
- Binary format: Faster but not debuggable
- YAML: More verbose, no significant benefit
- Compressed JSON: Adds complexity, storage is not a concern

---

## Decision 5: Recent Projects Storage Strategy

**Context**: Need fast access to recent projects list without loading full project data.

**Decision**: **localStorage for metadata + IndexedDB for full data**

Storage layout:
```typescript
// localStorage key: 'thingsvis:recent-projects'
type RecentProjectsMeta = Array<{
  id: string
  name: string
  thumbnail: string    // Base64, max 50KB
  updatedAt: number
}>  // Max 20 entries, sorted by updatedAt desc

// IndexedDB store: 'projects'
// Key: projectId, Value: full ThingsVisProjectFile
```

**Rationale**:
- localStorage is synchronous, perfect for quick UI render
- Thumbnails kept small (128x72 JPEG) for fast list display
- Full data in IndexedDB for async loading when project is opened
- 20-project limit prevents localStorage bloat

**Alternatives considered**:
- All in IndexedDB: Slower initial list render
- All in localStorage: Size limits hit quickly with thumbnails

---

## Decision 6: CommandRegistry Pattern

**Context**: Need centralized command management for shortcuts, toolbar actions, and help panel.

**Decision**: **Singleton CommandRegistry with React Hook**

```typescript
// Command definition
interface Command {
  id: string                    // e.g., 'editor.save'
  label: string                 // Display name
  shortcut?: string[]           // ['mod', 's'] where mod = Ctrl/⌘
  category: 'tool' | 'edit' | 'view' | 'project' | 'help'
  icon?: React.ComponentType
  when?: () => boolean          // Enable condition
  execute: () => void
}

// Registry API
class CommandRegistry {
  register(command: Command): void
  unregister(id: string): void
  execute(id: string): void
  getAll(): Command[]
  getByCategory(category: string): Command[]
}

// React hook
function useKeyboardShortcuts(registry: CommandRegistry): void
```

**Rationale**:
- Single source of truth for all commands
- Easy to generate help panel from registry
- Toolbar buttons can reference same commands
- Matches VS Code/Figma architecture

**Integration points**:
- Toolbar buttons: `onClick={() => registry.execute('editor.save')}`
- Keyboard hook: Maps key events to registry commands
- Help panel: `registry.getAll().map(cmd => ...)`

---

## Decision 7: Auto-Save Timer Strategy

**Context**: Need both debounced saves (on change) and periodic saves (safety net).

**Decision**: **Dual-timer approach (Excalidraw-inspired)**

```typescript
// Timer configuration
const DEBOUNCE_DELAY = 1000    // 1 second after last change
const PERIODIC_INTERVAL = 10000 // 10 seconds safety net

// Behavior
onChange:
  1. Mark state as dirty
  2. Clear existing debounce timer
  3. Set new debounce timer (1s)
  4. When timer fires: save if dirty, clear dirty flag

onPeriodicCheck (every 10s):
  1. If dirty: save immediately
  2. Clear dirty flag

onManualSave (Ctrl+S):
  1. Clear debounce timer
  2. Save immediately
  3. Clear dirty flag
  4. Show "Saved" toast

onBeforeUnload:
  1. If dirty: save synchronously (best effort)
  2. Show browser warning if save failed
```

**Rationale**:
- 1s debounce prevents save spam during rapid edits
- 10s periodic ensures no data loss if user stops editing
- Matches Excalidraw's proven approach
- Simple state machine (dirty flag) is easy to test

---

## Decision 8: Preview Mode URL Parameters

**Context**: `apps/preview` needs to support multiple modes via URL.

**Decision**: **Single `mode` parameter with three values**

```
# Development mode (default, current behavior)
/preview
/preview?mode=dev

# User preview mode (read-only, minimal UI)
/preview?mode=user&session=<token>

# Kiosk mode (fullscreen, no UI)
/preview?mode=kiosk&session=<token>
```

**Mode behavior**:

| Mode | Toolbar | Editing | Auto-fit | Use case |
|------|---------|---------|----------|----------|
| `dev` | Full debug | Yes | No | Development/testing |
| `user` | Minimal (refresh, fullscreen) | No | Optional | Quick preview |
| `kiosk` | None | No | Yes | Presentation/display |

**Rationale**:
- Single parameter keeps URL simple
- Backward compatible (no mode = dev)
- Matches Grafana's kiosk pattern
- Clear separation of concerns

---

## Summary: All Research Complete

| Topic | Decision | Confidence |
|-------|----------|------------|
| Save conflicts | Debounce reset + immediate | High |
| Preview data transfer | postMessage + session token | High |
| Keyboard conflicts | preventDefault + platform-aware | High |
| File format | Versioned JSON | High |
| Recent projects | localStorage meta + IDB data | High |
| Command system | CommandRegistry singleton | High |
| Auto-save timing | Dual-timer (1s debounce + 10s periodic) | High |
| Preview modes | URL `?mode=` parameter | High |

**Next**: Proceed to Phase 1 (data-model.md, contracts/)
