/**
 * UserToolbar Component
 * 
 * Minimal toolbar for user mode preview.
 * Shows basic controls like fullscreen toggle and project info.
 */

import React from 'react'

// =============================================================================
// Props
// =============================================================================

export interface UserToolbarProps {
  /** Project name to display */
  projectName?: string
  /** Whether fullscreen is active */
  isFullscreen?: boolean
  /** Callback for fullscreen toggle */
  onToggleFullscreen?: () => void
  /** Callback to refresh preview */
  onRefresh?: () => void
  /** Callback to go back to studio */
  onBack?: () => void
  /** Whether to show the toolbar */
  visible?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function UserToolbar({
  projectName,
  isFullscreen = false,
  onToggleFullscreen,
  onRefresh,
  onBack,
  visible = true,
}: UserToolbarProps) {
  if (!visible) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="flex items-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm text-white p-1">
        {/* Back */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title="Back to editor"
          >
            <BackIcon />
          </button>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        )}

        {/* Project name (optional) */}
        {projectName && projectName.trim().length > 0 && (
          <div className="px-2 text-sm select-none whitespace-nowrap">
            {projectName}
          </div>
        )}

        {/* Fullscreen */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Icons
// =============================================================================

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

export default UserToolbar
