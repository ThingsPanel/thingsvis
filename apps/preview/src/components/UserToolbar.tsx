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
  /** Callback to go back to studio */
  onBack?: () => void
  /** Whether to show the toolbar */
  visible?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function UserToolbar({
  projectName = 'Preview',
  isFullscreen = false,
  onToggleFullscreen,
  onBack,
  visible = true,
}: UserToolbarProps) {
  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-md bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          title="Back to editor"
        >
          <BackIcon />
        </button>
      )}

      {/* Project Name */}
      <div className="px-3 py-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-sm">
        {projectName}
      </div>

      {/* Fullscreen Button */}
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-md bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <ExitFullscreenIcon />
          ) : (
            <FullscreenIcon />
          )}
        </button>
      )}
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

export default UserToolbar
