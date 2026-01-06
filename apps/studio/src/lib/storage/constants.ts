/**
 * Storage layer constants
 * 
 * Configuration values for IndexedDB, localStorage, and auto-save behavior
 */

export const STORAGE_CONSTANTS = {
  /** IndexedDB database name */
  DB_NAME: 'thingsvis',
  
  /** IndexedDB store name for projects */
  PROJECTS_STORE: 'projects',
  
  /** localStorage key for recent projects list */
  RECENT_PROJECTS_KEY: 'thingsvis:recent-projects',
  
  /** sessionStorage key for preview session */
  PREVIEW_SESSION_KEY: 'thingsvis:preview-session',
  
  /** Maximum number of recent projects to keep */
  MAX_RECENT_PROJECTS: 20,
  
  /** Auto-save debounce delay in milliseconds */
  DEBOUNCE_DELAY_MS: 1000,
  
  /** Periodic save interval in milliseconds */
  PERIODIC_INTERVAL_MS: 10000,
  
  /** Preview session TTL in milliseconds (5 minutes) */
  SESSION_TTL_MS: 5 * 60 * 1000,
  
  /** File extension for exports */
  FILE_EXTENSION: '.thingsvis',
  
  /** MIME type for exports */
  MIME_TYPE: 'application/json',
  
  /** Current file format version */
  CURRENT_VERSION: '1.0.0',
  
  /** Duration to show "saved" status before returning to idle (ms) */
  SAVED_DISPLAY_MS: 2000,
  
  /** Maximum thumbnail size in bytes (~50KB base64) */
  MAX_THUMBNAIL_SIZE: 70000,
  
  /** Thumbnail dimensions for recent projects */
  THUMBNAIL_WIDTH: 128,
  THUMBNAIL_HEIGHT: 72,
} as const

/**
 * Default canvas configuration for new projects
 */
export const DEFAULT_CANVAS_CONFIG = {
  mode: 'fixed' as const,
  width: 1920,
  height: 1080,
  background: '#ffffff',
  gridEnabled: false,
  gridSize: 10,
}
