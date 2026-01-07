/**
 * useHelpPanel Hook
 * 
 * React hook for managing help panel open/close state.
 * Handles keyboard shortcut (?) toggle.
 */

import { useState, useCallback, useEffect } from 'react'

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing help panel state.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isOpen, open, close, toggle } = useHelpPanel()
 *   
 *   return (
 *     <>
 *       <button onClick={toggle}>Help</button>
 *       <ShortcutHelpPanel open={isOpen} onClose={close} />
 *     </>
 *   )
 * }
 * ```
 */
export function useHelpPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Handle keyboard shortcut for ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input field
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Toggle on ? key
      if (e.key === '?') {
        e.preventDefault()
        toggle()
        return
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, toggle, close])

  return {
    /** Whether the help panel is open */
    isOpen,
    /** Open the help panel */
    open,
    /** Close the help panel */
    close,
    /** Toggle the help panel */
    toggle,
  }
}

export default useHelpPanel
