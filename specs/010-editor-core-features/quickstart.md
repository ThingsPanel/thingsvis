# Quickstart: Editor Core Features

**Feature**: 010-editor-core-features  
**Estimated Time**: 30 minutes to understand, 2-3 days to implement

---

## Overview

This feature adds essential editor capabilities to ThingsVis Studio:

1. **Auto-Save** - Projects save automatically to IndexedDB
2. **Project Management** - Open, save, import/export projects
3. **Keyboard Shortcuts** - Fast tool switching and editing
4. **Preview Mode** - Preview visualization in new tab or fullscreen

---

## Quick Start (Development)

### 1. Understand the Codebase

```bash
# Key files to read first
apps/studio/src/lib/store.ts           # Existing kernel store
packages/thingsvis-kernel/src/history/ # Existing undo/redo
apps/preview/src/App.tsx               # Existing preview app
```

### 2. Implementation Order

Follow this order for minimal merge conflicts:

```
Phase 1: Storage Foundation (Day 1)
├── lib/storage/schemas.ts        # Zod schemas
├── lib/storage/projectStorage.ts # IndexedDB CRUD
└── lib/storage/recentProjects.ts # localStorage list

Phase 2: Auto-Save (Day 1)
├── lib/storage/autoSave.ts       # Timer logic
└── hooks/useAutoSave.ts          # React integration

Phase 3: Commands (Day 2)
├── lib/commands/CommandRegistry.ts
├── lib/commands/useKeyboardShortcuts.ts
└── lib/commands/defaultCommands.ts

Phase 4: UI Components (Day 2)
├── components/SaveIndicator.tsx
├── components/ShortcutHelpPanel.tsx
└── components/ProjectDialog.tsx

Phase 5: Preview Integration (Day 3)
├── apps/preview/src/hooks/usePreviewMode.ts
└── apps/preview/src/App.tsx (modify)
```

---

## Key Patterns

### Pattern 1: Debounced Auto-Save

```typescript
// apps/studio/src/lib/storage/autoSave.ts

class AutoSaveManager {
  private debounceTimer: number | null = null
  private periodicTimer: number | null = null
  private isDirty = false

  init(projectId: string, getState: () => ProjectFile) {
    // Start periodic timer (10s)
    this.periodicTimer = window.setInterval(() => {
      if (this.isDirty) this.saveNow()
    }, 10000)
    
    // Handle page unload
    window.addEventListener('beforeunload', this.handleUnload)
  }

  markDirty() {
    this.isDirty = true
    
    // Cancel existing debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    // Schedule new debounce (1s)
    this.debounceTimer = window.setTimeout(() => {
      this.saveNow()
    }, 1000)
  }

  async saveNow() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    
    try {
      this.setStatus('saving')
      await projectStorage.save(this.getState())
      this.isDirty = false
      this.setStatus('saved')
    } catch (error) {
      this.setStatus('error', error.message)
    }
  }
}
```

### Pattern 2: Command Registry

```typescript
// apps/studio/src/lib/commands/CommandRegistry.ts

class CommandRegistry implements ICommandRegistry {
  private commands = new Map<string, Command>()
  private listeners = new Set<() => void>()

  register(command: Command) {
    if (this.commands.has(command.id)) {
      throw new Error(`Command ${command.id} already registered`)
    }
    this.commands.set(command.id, command)
    this.notify()
  }

  async execute(id: string) {
    const command = this.commands.get(id)
    if (!command) return
    if (command.when && !command.when()) return
    await command.execute()
  }

  getByCategory(category: CommandCategory): Command[] {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.category === category)
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry()
```

### Pattern 3: Platform-Aware Shortcuts

```typescript
// apps/studio/src/lib/commands/useKeyboardShortcuts.ts

const isMac = navigator.platform.toUpperCase().includes('MAC')

function normalizeKey(key: string, event: KeyboardEvent): string {
  if (key === 'mod') {
    return isMac ? 'meta' : 'ctrl'
  }
  return key.toLowerCase()
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutKey[]): boolean {
  const pressed = new Set<string>()
  
  if (event.ctrlKey) pressed.add('ctrl')
  if (event.shiftKey) pressed.add('shift')
  if (event.altKey) pressed.add('alt')
  if (event.metaKey) pressed.add('meta')
  pressed.add(event.key.toLowerCase())
  
  const expected = new Set(shortcut.map(k => normalizeKey(k, event)))
  
  return pressed.size === expected.size && 
         [...pressed].every(k => expected.has(k))
}

export function useKeyboardShortcuts({ registry, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return

    const handler = (event: KeyboardEvent) => {
      // Skip if in input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (event.key !== 'Escape') return
      }

      for (const command of registry.getAll()) {
        if (command.shortcut && matchesShortcut(event, command.shortcut)) {
          event.preventDefault()
          event.stopPropagation()
          registry.execute(command.id)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [registry, enabled])
}
```

### Pattern 4: Preview Session Token

```typescript
// apps/studio/src/lib/storage/previewSession.ts

const SESSION_KEY = 'thingsvis:preview-session'
const TTL_MS = 5 * 60 * 1000 // 5 minutes

interface PreviewSession {
  token: string
  projectId: string
  createdAt: number
}

export function createPreviewSession(projectId: string): string {
  const token = crypto.randomUUID()
  const session: PreviewSession = {
    token,
    projectId,
    createdAt: Date.now(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return token
}

export function consumePreviewSession(token: string): string | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  
  const session: PreviewSession = JSON.parse(raw)
  
  // Validate token and expiry
  if (session.token !== token) return null
  if (Date.now() - session.createdAt > TTL_MS) return null
  
  // Consume (delete) the session
  sessionStorage.removeItem(SESSION_KEY)
  return session.projectId
}

export function openPreview(projectId: string, mode: 'user' | 'kiosk') {
  const token = createPreviewSession(projectId)
  const url = `/preview?mode=${mode}&session=${token}`
  window.open(url, '_blank')
}
```

---

## Testing Checklist

### Auto-Save
- [ ] Changes trigger auto-save after 1 second
- [ ] Rapid changes don't cause multiple saves (debounce works)
- [ ] Ctrl+S saves immediately
- [ ] Save status shows correctly (idle/saving/saved/error)
- [ ] Page unload triggers save

### Project Management
- [ ] Recent projects list shows correctly
- [ ] Opening project loads all data
- [ ] Import validates JSON format
- [ ] Export produces valid .thingsvis file
- [ ] File System Access API fallback works

### Keyboard Shortcuts
- [ ] V/R/T/H switch tools
- [ ] Ctrl+Z/Y undo/redo
- [ ] Ctrl+S saves
- [ ] Ctrl+P opens preview
- [ ] ? shows help panel
- [ ] Shortcuts ignored in text inputs
- [ ] Mac shows ⌘, Windows shows Ctrl

### Preview
- [ ] Opens in new tab with correct data
- [ ] Mode parameter works (user/kiosk)
- [ ] Session token is consumed after use
- [ ] Expired tokens are rejected
- [ ] Fullscreen mode hides UI

---

## Common Pitfalls

1. **Don't modify kernel packages** - All code goes in `apps/studio`
2. **Use idb-keyval** - Already installed, don't add another IndexedDB library
3. **Test on both Mac and Windows** - Keyboard shortcuts differ
4. **Handle offline gracefully** - IndexedDB works offline
5. **Debounce state changes** - Don't save on every keystroke
