/**
 * Shortcut Display Utilities
 * 
 * Platform-aware formatting for keyboard shortcuts.
 * Displays Mac-style (⌘) or Windows-style (Ctrl) based on platform.
 */

import type { ShortcutKey } from './types'

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Check if the current platform is macOS
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.toUpperCase().includes('MAC') ||
         navigator.userAgent.toUpperCase().includes('MAC')
}

/**
 * Get the current platform
 */
export function getPlatform(): 'mac' | 'windows' | 'linux' {
  if (typeof navigator === 'undefined') return 'windows'
  
  const platform = navigator.platform.toUpperCase()
  const userAgent = navigator.userAgent.toUpperCase()
  
  if (platform.includes('MAC') || userAgent.includes('MAC')) {
    return 'mac'
  }
  if (platform.includes('LINUX') || userAgent.includes('LINUX')) {
    return 'linux'
  }
  return 'windows'
}

// =============================================================================
// Key Symbols
// =============================================================================

const MAC_SYMBOLS: Record<string, string> = {
  mod: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  enter: '↩',
  escape: 'Esc',
  delete: '⌫',
  backspace: '⌫',
  tab: '⇥',
  space: 'Space',
}

const WINDOWS_SYMBOLS: Record<string, string> = {
  mod: 'Ctrl',
  meta: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  escape: 'Esc',
  delete: 'Del',
  backspace: 'Backspace',
  tab: 'Tab',
  space: 'Space',
}

// =============================================================================
// Format Functions
// =============================================================================

/**
 * Format a single key for display
 */
function formatKey(key: ShortcutKey, useMacSymbols: boolean): string {
  const symbols = useMacSymbols ? MAC_SYMBOLS : WINDOWS_SYMBOLS
  
  // Check if it's a special key
  const lowerKey = key.toLowerCase()
  if (symbols[lowerKey]) {
    return symbols[lowerKey]
  }
  
  // Single character - uppercase for display
  if (key.length === 1) {
    return key.toUpperCase()
  }
  
  // Named key - capitalize first letter
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
}

/**
 * Format a shortcut for display.
 * Returns platform-appropriate string, e.g., "⌘S" on Mac, "Ctrl+S" on Windows.
 */
export function formatShortcut(shortcut: ShortcutKey[]): string {
  const useMacSymbols = isMac()
  
  const formatted = shortcut.map(key => formatKey(key, useMacSymbols))
  
  // Mac uses no separator, Windows uses +
  if (useMacSymbols) {
    return formatted.join('')
  }
  return formatted.join('+')
}

/**
 * Format a shortcut with explicit platform choice
 */
export function formatShortcutForPlatform(
  shortcut: ShortcutKey[],
  platform: 'mac' | 'windows' | 'linux'
): string {
  const useMacSymbols = platform === 'mac'
  
  const formatted = shortcut.map(key => formatKey(key, useMacSymbols))
  
  if (useMacSymbols) {
    return formatted.join('')
  }
  return formatted.join('+')
}

/**
 * Format shortcut for both platforms (for display in documentation)
 */
export function formatShortcutBoth(shortcut: ShortcutKey[]): string {
  const mac = formatShortcutForPlatform(shortcut, 'mac')
  const win = formatShortcutForPlatform(shortcut, 'windows')
  
  if (mac === win) {
    return mac
  }
  return `${win} / ${mac}`
}

// =============================================================================
// Export Utility Object
// =============================================================================

export const shortcutDisplay = {
  format: formatShortcut,
  formatForPlatform: formatShortcutForPlatform,
  formatBoth: formatShortcutBoth,
  getPlatform,
  isMac,
}
