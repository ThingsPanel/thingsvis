/**
 * useKeyboardShortcuts Hook
 * 
 * React hook for handling keyboard shortcuts.
 * Matches shortcuts against the command registry and executes commands.
 */

import { useEffect, useCallback } from 'react'
import type { ICommandRegistry, ShortcutKey, UseKeyboardShortcutsOptions } from './types'
import { isMac } from './shortcutDisplay'

// =============================================================================
// Key Normalization
// =============================================================================

/**
 * Normalize a shortcut key to match against keyboard events
 */
function normalizeKey(key: ShortcutKey): string {
  const lower = key.toLowerCase()
  
  if (lower === 'mod') {
    return isMac() ? 'meta' : 'ctrl'
  }
  
  return lower
}

/**
 * Get the effective key from a keyboard event
 */
function getEventKey(event: KeyboardEvent): string {
  // Handle special keys
  const key = event.key.toLowerCase()
  
  // Map some key names
  const keyMap: Record<string, string> = {
    ' ': 'space',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
  }
  
  return keyMap[key] || key
}

// =============================================================================
// Shortcut Matching
// =============================================================================

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutKey[]): boolean {
  // Build set of pressed keys
  const pressedModifiers = new Set<string>()
  if (event.ctrlKey) pressedModifiers.add('ctrl')
  if (event.shiftKey) pressedModifiers.add('shift')
  if (event.altKey) pressedModifiers.add('alt')
  if (event.metaKey) pressedModifiers.add('meta')
  
  const pressedKey = getEventKey(event)
  
  // Build set of expected keys
  const expectedModifiers = new Set<string>()
  let expectedKey = ''
  
  for (const key of shortcut) {
    const normalized = normalizeKey(key)
    
    if (['ctrl', 'shift', 'alt', 'meta'].includes(normalized)) {
      expectedModifiers.add(normalized)
    } else {
      expectedKey = normalized
    }
  }
  
  // Check if all modifiers match
  if (pressedModifiers.size !== expectedModifiers.size) {
    return false
  }
  
  for (const mod of expectedModifiers) {
    if (!pressedModifiers.has(mod)) {
      return false
    }
  }
  
  // Check if the main key matches
  return pressedKey === expectedKey
}

// =============================================================================
// Input Detection
// =============================================================================

/**
 * Check if the event target is an input field
 */
function isInputField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false
  }
  
  const tagName = target.tagName.toUpperCase()
  
  // Standard input elements
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true
  }
  
  // Contenteditable elements
  if (target.isContentEditable) {
    return true
  }
  
  // CodeMirror or other code editors
  if (target.classList.contains('cm-content') || 
      target.closest('.cm-editor') ||
      target.closest('[data-lexical-editor]')) {
    return true
  }
  
  return false
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * React hook for keyboard shortcut handling.
 * 
 * @example
 * ```tsx
 * function Editor() {
 *   useKeyboardShortcuts({ registry: commandRegistry })
 *   return <Canvas />
 * }
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { registry, enabled = true, target } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if in input field (except for Escape)
    if (isInputField(event.target) && event.key !== 'Escape') {
      return
    }
    
    // Find matching command
    const commands = registry.getAll()
    
    for (const command of commands) {
      if (!command.shortcut) continue
      
      if (matchesShortcut(event, command.shortcut)) {
        // Check if command is enabled
        if (!registry.isEnabled(command.id)) {
          continue
        }
        
        // Prevent default browser behavior
        event.preventDefault()
        event.stopPropagation()
        
        // Execute command
        registry.execute(command.id)
        return
      }
    }
  }, [registry])

  useEffect(() => {
    if (!enabled) return

    const eventTarget = target || window
    
    eventTarget.addEventListener('keydown', handleKeyDown as EventListener)
    
    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [enabled, target, handleKeyDown])
}

export default useKeyboardShortcuts
