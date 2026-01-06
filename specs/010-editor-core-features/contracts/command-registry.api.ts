/**
 * Command Registry API Contract
 * 
 * Defines the interface for keyboard shortcuts and command system.
 * Implementation lives in apps/studio/src/lib/commands/
 */

import type { ComponentType } from 'react'

// =============================================================================
// Command Definition
// =============================================================================

export interface Command {
  /** Unique identifier, e.g., 'editor.save', 'tool.select' */
  id: string

  /** Display label in English */
  label: string

  /** Display label in Chinese (optional) */
  labelZh?: string

  /** Keyboard shortcut, e.g., ['mod', 's'] */
  shortcut?: ShortcutKey[]

  /** Category for help panel grouping */
  category: CommandCategory

  /** Icon component for toolbar display */
  icon?: ComponentType<{ className?: string }>

  /** Enable condition - command is disabled if returns false */
  when?: () => boolean

  /** Action to execute */
  execute: () => void | Promise<void>
}

/**
 * Shortcut key types:
 * - 'mod': Platform modifier (Ctrl on Windows/Linux, ⌘ on Mac)
 * - 'ctrl', 'shift', 'alt', 'meta': Standard modifiers
 * - Single character: 'v', 'r', 's', '?', etc.
 * - Named keys: 'escape', 'delete', 'backspace', 'enter', etc.
 */
export type ShortcutKey =
  | 'mod'
  | 'ctrl'
  | 'shift'
  | 'alt'
  | 'meta'
  | 'escape'
  | 'delete'
  | 'backspace'
  | 'enter'
  | 'space'
  | 'tab'
  | string  // Single character

export type CommandCategory =
  | 'tool'     // Tool switching: select, rectangle, text, pan
  | 'edit'     // Editing: undo, redo, copy, paste, delete
  | 'view'     // View: zoom in/out, reset, fit
  | 'project'  // Project: save, open, export, preview
  | 'help'     // Help: shortcuts panel

// =============================================================================
// Command Registry
// =============================================================================

export interface ICommandRegistry {
  /**
   * Register a command.
   * Throws if command with same ID already exists.
   */
  register(command: Command): void

  /**
   * Register multiple commands at once.
   */
  registerAll(commands: Command[]): void

  /**
   * Unregister a command by ID.
   */
  unregister(id: string): void

  /**
   * Execute a command by ID.
   * Does nothing if command not found or disabled.
   */
  execute(id: string): Promise<void>

  /**
   * Get command by ID.
   */
  get(id: string): Command | undefined

  /**
   * Get all registered commands.
   */
  getAll(): Command[]

  /**
   * Get commands filtered by category.
   */
  getByCategory(category: CommandCategory): Command[]

  /**
   * Check if a command is enabled.
   */
  isEnabled(id: string): boolean

  /**
   * Subscribe to command registry changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
}

// =============================================================================
// Keyboard Shortcut Hook
// =============================================================================

export interface UseKeyboardShortcutsOptions {
  /** Command registry instance */
  registry: ICommandRegistry

  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean

  /** Element to attach listeners to (default: window) */
  target?: HTMLElement | Window
}

/**
 * React hook for keyboard shortcut handling.
 * 
 * Usage:
 * ```tsx
 * function Editor() {
 *   useKeyboardShortcuts({ registry: commandRegistry })
 *   return <Canvas />
 * }
 * ```
 */
export type UseKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => void

// =============================================================================
// Shortcut Display Utilities
// =============================================================================

export interface IShortcutDisplay {
  /**
   * Format shortcut for display.
   * Returns platform-appropriate string, e.g., "⌘S" on Mac, "Ctrl+S" on Windows.
   */
  format(shortcut: ShortcutKey[]): string

  /**
   * Get the current platform.
   */
  getPlatform(): 'mac' | 'windows' | 'linux'

  /**
   * Check if running on Mac.
   */
  isMac(): boolean
}

// =============================================================================
// Built-in Command IDs
// =============================================================================

export const COMMAND_IDS = {
  // Tool commands
  TOOL_SELECT: 'tool.select',
  TOOL_RECTANGLE: 'tool.rectangle',
  TOOL_TEXT: 'tool.text',
  TOOL_PAN: 'tool.pan',

  // Edit commands
  EDIT_UNDO: 'edit.undo',
  EDIT_REDO: 'edit.redo',
  EDIT_COPY: 'edit.copy',
  EDIT_PASTE: 'edit.paste',
  EDIT_DELETE: 'edit.delete',
  EDIT_SELECT_ALL: 'edit.selectAll',
  EDIT_DESELECT: 'edit.deselect',

  // View commands
  VIEW_ZOOM_IN: 'view.zoomIn',
  VIEW_ZOOM_OUT: 'view.zoomOut',
  VIEW_ZOOM_RESET: 'view.zoomReset',
  VIEW_FIT: 'view.fit',

  // Project commands
  PROJECT_SAVE: 'project.save',
  PROJECT_OPEN: 'project.open',
  PROJECT_EXPORT: 'project.export',
  PROJECT_PREVIEW: 'project.preview',

  // Help commands
  HELP_SHORTCUTS: 'help.shortcuts',
} as const

// =============================================================================
// Default Shortcut Mappings
// =============================================================================

export const DEFAULT_SHORTCUTS: Record<string, ShortcutKey[]> = {
  // Tools (single key)
  [COMMAND_IDS.TOOL_SELECT]: ['v'],
  [COMMAND_IDS.TOOL_RECTANGLE]: ['r'],
  [COMMAND_IDS.TOOL_TEXT]: ['t'],
  [COMMAND_IDS.TOOL_PAN]: ['h'],

  // Edit (mod + key)
  [COMMAND_IDS.EDIT_UNDO]: ['mod', 'z'],
  [COMMAND_IDS.EDIT_REDO]: ['mod', 'y'],
  [COMMAND_IDS.EDIT_COPY]: ['mod', 'c'],
  [COMMAND_IDS.EDIT_PASTE]: ['mod', 'v'],
  [COMMAND_IDS.EDIT_DELETE]: ['delete'],
  [COMMAND_IDS.EDIT_SELECT_ALL]: ['mod', 'a'],
  [COMMAND_IDS.EDIT_DESELECT]: ['escape'],

  // View
  [COMMAND_IDS.VIEW_ZOOM_IN]: ['mod', '='],
  [COMMAND_IDS.VIEW_ZOOM_OUT]: ['mod', '-'],
  [COMMAND_IDS.VIEW_ZOOM_RESET]: ['mod', '0'],
  [COMMAND_IDS.VIEW_FIT]: ['mod', '1'],

  // Project
  [COMMAND_IDS.PROJECT_SAVE]: ['mod', 's'],
  [COMMAND_IDS.PROJECT_OPEN]: ['mod', 'o'],
  [COMMAND_IDS.PROJECT_EXPORT]: ['mod', 'e'],
  [COMMAND_IDS.PROJECT_PREVIEW]: ['mod', 'p'],

  // Help
  [COMMAND_IDS.HELP_SHORTCUTS]: ['?'],
} as const

// =============================================================================
// Shortcut Help Panel Props
// =============================================================================

export interface ShortcutHelpPanelProps {
  /** Whether the panel is open */
  open: boolean

  /** Callback when panel should close */
  onClose: () => void

  /** Command registry to display shortcuts from */
  registry: ICommandRegistry
}
