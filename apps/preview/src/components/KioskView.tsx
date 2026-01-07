/**
 * KioskView Component
 * 
 * Fullscreen wrapper for kiosk/presentation mode.
 * Hides all UI elements and shows only the visualization.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react'

// =============================================================================
// Props
// =============================================================================

export interface KioskViewProps {
  /** Child content to display */
  children: React.ReactNode
  /** Whether to auto-enter fullscreen on mount */
  autoFullscreen?: boolean
  /** Show exit hint on hover */
  showExitHint?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function KioskView({
  children,
  autoFullscreen = true,
  showExitHint = true,
}: KioskViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const hintTimeout = useRef<number | null>(null)

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Auto-enter fullscreen
  useEffect(() => {
    if (autoFullscreen && containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(console.error)
    }
  }, [autoFullscreen])

  // Show hint on mouse move
  const handleMouseMove = useCallback(() => {
    if (!showExitHint) return

    setShowHint(true)
    
    if (hintTimeout.current) {
      clearTimeout(hintTimeout.current)
    }
    
    hintTimeout.current = window.setTimeout(() => {
      setShowHint(false)
    }, 2000)
  }, [showExitHint])

  // Exit fullscreen on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.().catch(console.error)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (hintTimeout.current) {
        clearTimeout(hintTimeout.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Main Content */}
      {children}

      {/* Exit Hint */}
      {showHint && isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/70 text-white text-sm animate-fade-in">
          Press <kbd className="px-1.5 py-0.5 mx-1 rounded bg-white/20">Esc</kbd> to exit fullscreen
        </div>
      )}
    </div>
  )
}

export default KioskView
