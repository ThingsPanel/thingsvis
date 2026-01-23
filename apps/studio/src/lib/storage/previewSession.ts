/**
 * Preview Session Manager
 * 
 * Manages secure data transfer between studio and preview tabs.
 * Uses postMessage for cross-origin communication in development.
 */

import { STORAGE_CONSTANTS } from './constants'
import type { PreviewSession, PreviewMode } from './types'

// Store project data temporarily for preview window to request
let pendingPreviewData: { projectId: string; data: any } | null = null

// =============================================================================
// Session Management
// =============================================================================

/**
 * Create a one-time session for preview.
 * Returns the session token to pass in URL.
 * Uses localStorage for cross-origin compatibility (dev mode has different ports).
 */
export function createSession(projectId: string): string {
  const token = crypto.randomUUID()
  
  const session: PreviewSession = {
    token,
    projectId,
    createdAt: Date.now(),
  }
  
  // Use localStorage instead of sessionStorage for cross-origin support
  localStorage.setItem(
    STORAGE_CONSTANTS.PREVIEW_SESSION_KEY,
    JSON.stringify(session)
  )
  
  return token
}

/**
 * Consume a session token and get the project ID.
 * Token is deleted after use (one-time).
 * Returns null if token is invalid or expired.
 */
export function consumeSession(token: string): string | null {
  const stored = localStorage.getItem(STORAGE_CONSTANTS.PREVIEW_SESSION_KEY)
  if (!stored) return null
  
  try {
    const session: PreviewSession = JSON.parse(stored)
    
    // Check if token matches
    if (session.token !== token) {
      return null
    }
    
    // Check if session is expired (5 minute TTL)
    if (Date.now() - session.createdAt > STORAGE_CONSTANTS.SESSION_TTL_MS) {
      localStorage.removeItem(STORAGE_CONSTANTS.PREVIEW_SESSION_KEY)
      return null
    }
    
    // Delete session after use (one-time)
    localStorage.removeItem(STORAGE_CONSTANTS.PREVIEW_SESSION_KEY)
    
    return session.projectId
  } catch {
    return null
  }
}

/**
 * Set project data for preview window to request via postMessage
 */
export function setPreviewData(projectId: string, data: any): void {
  pendingPreviewData = { projectId, data }
}

/**
 * Get pending preview data
 */
export function getPreviewData(): { projectId: string; data: any } | null {
  return pendingPreviewData
}

/**
 * Clear pending preview data
 */
export function clearPreviewData(): void {
  pendingPreviewData = null
}

/**
 * Open preview in new tab with session token.
 * Also sets up postMessage listener for data transfer.
 */
export function openPreview(projectId: string, mode: PreviewMode = 'user'): void {
  // Create session token
  const token = createSession(projectId)
  
  // Build preview URL
  const previewPath = getPreviewPath()
  const url = new URL(previewPath, window.location.origin)
  url.searchParams.set('session', token)
  url.searchParams.set('mode', mode)
  url.searchParams.set('projectId', projectId)
  
  // Open in new tab
  window.open(url.toString(), '_blank')
}

/**
 * Setup message listener for preview data requests.
 * Should be called once when studio initializes.
 */
export function setupPreviewMessageListener(): () => void {
  const handler = (event: MessageEvent) => {
    // Validate origin in production (skip in dev for different ports)
    const isDevMode = window.location.hostname === 'localhost'
    if (!isDevMode && event.origin !== window.location.origin) {
      return
    }
    
    if (event.data?.type === 'THINGSVIS_REQUEST_PROJECT_DATA') {
      const { projectId } = event.data
      const previewData = getPreviewData()
      
      if (previewData && previewData.projectId === projectId) {
        // Send data back to preview window
        event.source?.postMessage({
          type: 'THINGSVIS_PROJECT_DATA',
          projectId,
          data: previewData.data,
        }, { targetOrigin: '*' })
        
        // Clear after sending
        clearPreviewData()
      }
    }
  }
  
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}

/**
 * Get the path to the preview application.
 * In development, preview runs on a different port.
 */
function getPreviewPath(): string {
  // In development, studio runs on port 3000 and preview on port 8080
  // Check if we're on localhost with port 3000 (studio dev server)
  const isDevStudio = window.location.hostname === 'localhost' && 
    (window.location.port === '3000' || window.location.port === '3001')
  
  if (isDevStudio) {
    // In dev, preview runs on port 8080 (rspack default)
    return 'http://localhost:8080/'
  }
  
  // In production, preview is a sibling directory
  return '/preview/'
}

/**
 * Parse preview URL parameters
 */
export function parsePreviewParams(): { 
  token: string | null
  mode: PreviewMode 
} {
  const params = new URLSearchParams(window.location.search)
  
  return {
    token: params.get('session'),
    mode: (params.get('mode') as PreviewMode) || 'dev',
  }
}

// =============================================================================
// Fullscreen Management
// =============================================================================

/**
 * Enter fullscreen mode
 */
export async function enterFullscreen(element?: HTMLElement): Promise<void> {
  const target = element || document.documentElement
  
  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen()
    } else if ((target as any).webkitRequestFullscreen) {
      await (target as any).webkitRequestFullscreen()
    } else if ((target as any).mozRequestFullScreen) {
      await (target as any).mozRequestFullScreen()
    } else if ((target as any).msRequestFullscreen) {
      await (target as any).msRequestFullscreen()
    }
  } catch (error) {
    
  }
}

/**
 * Exit fullscreen mode
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen()
    }
  } catch (error) {
    
  }
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  )
}

/**
 * Toggle fullscreen mode
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<void> {
  if (isFullscreen()) {
    await exitFullscreen()
  } else {
    await enterFullscreen(element)
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const previewSession = {
  create: createSession,
  consume: consumeSession,
  open: openPreview,
  parseParams: parsePreviewParams,
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  toggleFullscreen,
}
