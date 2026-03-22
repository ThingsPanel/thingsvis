/**
 * TypeScript types and interfaces for the storage layer
 *
 * Runtime types that don't need Zod validation
 */

// =============================================================================
// Save State
// =============================================================================

/**
 * Possible save statuses for UI feedback
 */
export type SaveStatus =
  | 'idle' // No unsaved changes
  | 'dirty' // Has unsaved changes
  | 'saving' // Save in progress
  | 'saved' // Just saved (briefly shown, then returns to idle)
  | 'error'; // Save failed

/**
 * Current save state for the active project
 */
export interface SaveState {
  /** Current save status */
  status: SaveStatus;
  /** Timestamp of last successful save (null if never saved) */
  lastSavedAt: number | null;
  /** Error message if save failed */
  error: string | null;
}

// =============================================================================
// Preview Session
// =============================================================================

/**
 * One-time session for secure preview data transfer between studio and preview tabs.
 * Stored in sessionStorage to limit scope to the browser session.
 */
export interface PreviewSession {
  /** UUID token for one-time use */
  token: string;
  /** Project ID to load in preview */
  projectId: string;
  /** Creation timestamp for expiry check (5 min TTL) */
  createdAt: number;
}

/**
 * Preview mode types
 */
export type PreviewMode = 'dev' | 'user' | 'kiosk';

// =============================================================================
// Storage Operation Results
// =============================================================================

/**
 * Result of an import operation
 */
export interface ImportResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

/**
 * Listener for save state changes
 */
export type SaveStateListener = (state: SaveState) => void;

// =============================================================================
// Auto-Save Configuration
// =============================================================================

/**
 * Configuration options for auto-save behavior
 */
export interface AutoSaveConfig {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceDelay?: number;
  /** Periodic save interval in milliseconds (default: 10000) */
  periodicInterval?: number;
  /** Whether to warn on page unload (default: true) */
  warnOnUnload?: boolean;
  /** Save behavior: auto = debounce/periodic save, manual = only track dirty and require explicit saveNow() */
  mode?: 'auto' | 'manual';
}
