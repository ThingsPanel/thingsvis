/**
 * Command system types and interfaces
 * 
 * Defines the structure for keyboard shortcuts and command registration
 */

import type { ComponentType } from 'react'

// =============================================================================
// Command Definition
// =============================================================================

/**
 * A registered command that can be executed via keyboard shortcut or UI action
 */
export interface Command {
  /** Unique identifier, e.g., 'project.save', 'tool.select' */
  id: string

  /** Display label in English */
  label: string

  /** Keyboard shortcut, e.g., ['mod', 's'] */
  shortcut?: ShortcutKey[]

  /** Category for help panel grouping */
  category: CommandCategory

  /** Icon component for toolbar display */
  icon?: ComponentType<{ className?: string }>

  /** Enable condition - command is disabled if returns false */
  when?: () => boolean

  /** Action to execute when command is triggered */
  execute: () => void | Promise<void>
}

// =============================================================================
// Shortcut Key Types
// =============================================================================

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
  | string  // Single character or named key

// =============================================================================
// Command Categories
// =============================================================================

/**
 * Command categories for organizing in help panel
 */
export type CommandCategory =
  | 'tool'     // Tool switching: select, rectangle, text, pan
  | 'edit'     // Editing: undo, redo, copy, paste, delete
  | 'view'     // View: zoom in/out, reset, fit
  | 'project'  // Project: save, open, export, preview
  | 'help'     // Help: shortcuts panel

// =============================================================================
// Command Registry Interface
// =============================================================================

/**
 * Interface for the command registry singleton
 */
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
// Keyboard Shortcut Hook Types
// =============================================================================

/**
 * Options for the keyboard shortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  /** Command registry instance */
  registry: ICommandRegistry

  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean

  /** Element to attach listeners to (default: window) */
  target?: HTMLElement | Window
}
