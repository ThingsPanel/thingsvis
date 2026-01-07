/**
 * usePreviewMode Hook
 * 
 * React hook for parsing preview mode from URL parameters.
 * Handles session token consumption and mode detection.
 */

import { useState, useEffect, useCallback } from 'react'

// =============================================================================
// Types
// =============================================================================

export type PreviewMode = 'dev' | 'user' | 'kiosk'

export interface PreviewModeState {
  /** Current preview mode */
  mode: PreviewMode
  /** Project ID from session (null if not from session) */
  projectId: string | null
  /** Whether session was successfully consumed */
  sessionConsumed: boolean
  /** Whether the preview is loading */
  isLoading: boolean
  /** Error message if any */
  error: string | null
}

// =============================================================================
// Constants (duplicated from studio to avoid cross-app imports)
// =============================================================================

const PREVIEW_SESSION_KEY = 'thingsvis:preview-session'
const SESSION_TTL_MS = 5 * 60 * 1000 // 5 minutes

// =============================================================================
// Session Consumption
// =============================================================================

interface PreviewSession {
  token: string
  projectId: string
  createdAt: number
}

/**
 * Consume session from localStorage (cross-origin compatible)
 */
function consumeSession(token: string): string | null {
  const stored = localStorage.getItem(PREVIEW_SESSION_KEY)
  if (!stored) return null
  
  try {
    const session: PreviewSession = JSON.parse(stored)
    
    // Check if token matches
    if (session.token !== token) {
      return null
    }
    
    // Check if session is expired
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      localStorage.removeItem(PREVIEW_SESSION_KEY)
      return null
    }
    
    // Delete session after use (one-time)
    localStorage.removeItem(PREVIEW_SESSION_KEY)
    
    return session.projectId
  } catch {
    return null
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for detecting and handling preview mode.
 * 
 * @example
 * ```tsx
 * function PreviewApp() {
 *   const { mode, projectId, isLoading } = usePreviewMode()
 *   
 *   if (isLoading) return <Loading />
 *   
 *   switch (mode) {
 *     case 'kiosk': return <KioskView projectId={projectId} />
 *     case 'user': return <UserView projectId={projectId} />
 *     default: return <DevView />
 *   }
 * }
 * ```
 */
export function usePreviewMode(): PreviewModeState {
  const [state, setState] = useState<PreviewModeState>({
    mode: 'dev',
    projectId: null,
    sessionConsumed: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionToken = params.get('session')
    const modeParam = params.get('mode') as PreviewMode | null
    
    // Determine mode
    const mode = modeParam || 'dev'
    
    // If we have a session token, try to consume it
    if (sessionToken) {
      const projectId = consumeSession(sessionToken)
      
      if (projectId) {
        setState({
          mode,
          projectId,
          sessionConsumed: true,
          isLoading: false,
          error: null,
        })
      } else {
        setState({
          mode: 'dev',
          projectId: null,
          sessionConsumed: false,
          isLoading: false,
          error: 'Invalid or expired session',
        })
      }
    } else {
      // No session token, just use mode
      setState({
        mode,
        projectId: null,
        sessionConsumed: false,
        isLoading: false,
        error: null,
      })
    }

    // Clean up URL parameters
    if (sessionToken || modeParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete('session')
      // Keep mode in URL for bookmarking/sharing
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  return state
}

export default usePreviewMode
