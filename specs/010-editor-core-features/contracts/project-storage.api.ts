/**
 * Project Storage API Contract
 * 
 * Defines the interface for project persistence operations.
 * Implementation lives in apps/studio/src/lib/storage/
 */

import type { ProjectFile, ProjectMeta, RecentProjectEntry } from './schemas'

// =============================================================================
// Project Storage Service
// =============================================================================

export interface IProjectStorage {
  /**
   * Save project to IndexedDB.
   * Also updates recent projects list in localStorage.
   */
  save(project: ProjectFile): Promise<void>

  /**
   * Load project from IndexedDB by ID.
   * Returns null if project not found.
   */
  load(projectId: string): Promise<ProjectFile | null>

  /**
   * Delete project from IndexedDB.
   * Also removes from recent projects list.
   */
  delete(projectId: string): Promise<void>

  /**
   * Check if project exists in IndexedDB.
   */
  exists(projectId: string): Promise<boolean>

  /**
   * Get recent projects list from localStorage.
   * Returns up to 20 most recently modified projects.
   */
  getRecentProjects(): RecentProjectEntry[]

  /**
   * Clear a project from recent projects list.
   * Does not delete the project from IndexedDB.
   */
  removeFromRecent(projectId: string): void

  /**
   * Export project as downloadable JSON blob.
   */
  exportAsBlob(project: ProjectFile): Blob

  /**
   * Import project from uploaded JSON file.
   * Validates the file format and returns parsed project.
   * Throws ImportError if validation fails.
   */
  importFromFile(file: File): Promise<ProjectFile>
}

// =============================================================================
// Auto-Save Manager
// =============================================================================

export interface IAutoSaveManager {
  /**
   * Initialize auto-save with project ID and state getter.
   */
  init(projectId: string, getState: () => ProjectFile): void

  /**
   * Mark state as dirty and schedule debounced save.
   * Called on every state change.
   */
  markDirty(): void

  /**
   * Force immediate save, bypassing debounce.
   * Called on Ctrl+S or before unload.
   */
  saveNow(): Promise<void>

  /**
   * Get current save state for UI display.
   */
  getStatus(): SaveState

  /**
   * Subscribe to save state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: (state: SaveState) => void): () => void

  /**
   * Stop all timers and cleanup.
   */
  destroy(): void
}

export interface SaveState {
  status: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
  lastSavedAt: number | null
  error: string | null
}

// =============================================================================
// Preview Session Manager
// =============================================================================

export interface IPreviewSession {
  /**
   * Create a one-time session for preview.
   * Returns the session token to pass in URL.
   */
  create(projectId: string): string

  /**
   * Consume a session token and get the project ID.
   * Token is deleted after use.
   * Returns null if token is invalid or expired.
   */
  consume(token: string): string | null

  /**
   * Open preview in new tab with session token.
   */
  openPreview(projectId: string, mode: 'user' | 'kiosk'): void
}

// =============================================================================
// Error Types
// =============================================================================

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

// =============================================================================
// Constants
// =============================================================================

export const STORAGE_CONSTANTS = {
  /** IndexedDB database name */
  DB_NAME: 'thingsvis',
  
  /** IndexedDB store name for projects */
  PROJECTS_STORE: 'projects',
  
  /** localStorage key for recent projects */
  RECENT_PROJECTS_KEY: 'thingsvis:recent-projects',
  
  /** sessionStorage key for preview session */
  PREVIEW_SESSION_KEY: 'thingsvis:preview-session',
  
  /** Maximum number of recent projects to keep */
  MAX_RECENT_PROJECTS: 20,
  
  /** Auto-save debounce delay in milliseconds */
  DEBOUNCE_DELAY_MS: 1000,
  
  /** Periodic save interval in milliseconds */
  PERIODIC_INTERVAL_MS: 10000,
  
  /** Preview session TTL in milliseconds */
  SESSION_TTL_MS: 5 * 60 * 1000, // 5 minutes
  
  /** File extension for exports */
  FILE_EXTENSION: '.thingsvis',
  
  /** MIME type for exports */
  MIME_TYPE: 'application/json',
} as const
