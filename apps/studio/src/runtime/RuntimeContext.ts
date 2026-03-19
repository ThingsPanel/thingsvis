/**
 * Canonical RuntimeContext — the single source of truth for
 * "who am I, how was I launched, where do I store data".
 *
 * Replaces the scattered mode/channel/storage decisions currently
 * duplicated across AuthContext, SaveStrategy, useStorage,
 * and ProjectContext.
 *
 * This type is *read-only* after derivation — consumers observe it,
 * they never mutate it.
 */

// ---------------------------------------------------------------------------
// Channel — how the application was launched
// ---------------------------------------------------------------------------

/**
 * - `browser`  — user opened the standalone editor directly
 * - `embed`    — loaded inside a host platform iframe with auth token
 * - `guest`    — anonymous/demo mode, no backend auth
 */
export type RuntimeChannel = 'browser' | 'embed' | 'guest';

// ---------------------------------------------------------------------------
// Execution mode — standalone vs embedded
// ---------------------------------------------------------------------------

/**
 * - `standalone` — full editor running on its own
 * - `embedded`   — running inside a host platform (iframe / web-component)
 */
export type ExecutionMode = 'standalone' | 'embedded';

// ---------------------------------------------------------------------------
// Storage mode — where persisted data lives
// ---------------------------------------------------------------------------

/**
 * - `local` — IndexedDB / browser storage (offline, no auth)
 * - `cloud` — ThingsVis Cloud API (authenticated)
 */
export type StorageMode = 'local' | 'cloud';

// ---------------------------------------------------------------------------
// Save target — who owns the save
// ---------------------------------------------------------------------------

/**
 * - `self` — this runtime saves to its own backend
 * - `host` — this runtime dispatches data to the host platform for saving
 */
export type SaveTarget = 'self' | 'host';

// ---------------------------------------------------------------------------
// RuntimeContext (immutable value object)
// ---------------------------------------------------------------------------

export interface RuntimeContext {
  /** How the application was launched */
  readonly channel: RuntimeChannel;
  /** Whether running standalone or inside a host */
  readonly executionMode: ExecutionMode;
  /** Where data is persisted */
  readonly storageMode: StorageMode;
  /** Who is responsible for the save action */
  readonly saveTarget: SaveTarget;
}
