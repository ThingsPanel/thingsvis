/**
 * deriveRuntimeContext — pure function that computes the canonical RuntimeContext.
 *
 * This replaces the scattered mode / channel / storage decisions currently
 * duplicated across AuthContext, SaveStrategy, useStorage, and ProjectContext.
 *
 * The function is intentionally side-effect-free: it reads signals from its
 * input parameter, never from globalThis or DOM directly.
 */

import type {
  RuntimeContext,
  RuntimeChannel,
  ExecutionMode,
  StorageMode,
  SaveTarget,
} from './RuntimeContext';

// ---------------------------------------------------------------------------
// Input signals (everything the derivation needs to decide)
// ---------------------------------------------------------------------------

export interface RuntimeSignals {
  /** Whether the window is inside an iframe (window !== window.parent) */
  isInIframe: boolean;
  /** URL search params (from hash route or window.location.search) */
  urlParams: URLSearchParams;
  /** Whether the user has a valid auth token */
  isAuthenticated: boolean;
  /**
   * Embed token if provided (e.g. via URL param `token` or message-router).
   * Non-empty string means embed auth is present.
   */
  embedToken?: string;
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

export function deriveRuntimeContext(signals: RuntimeSignals): RuntimeContext {
  const { isInIframe, urlParams, isAuthenticated, embedToken } = signals;

  // ── Channel ──────────────────────────────────────────────────────────────
  const channel: RuntimeChannel = resolveChannel(
    isInIframe,
    urlParams,
    isAuthenticated,
    embedToken,
  );

  // ── Execution mode ───────────────────────────────────────────────────────
  const executionMode: ExecutionMode = channel === 'embed' ? 'embedded' : 'standalone';

  // ── Storage mode ─────────────────────────────────────────────────────────
  const storageMode: StorageMode = resolveStorageMode(channel, isAuthenticated);

  // ── Save target ──────────────────────────────────────────────────────────
  const saveTarget: SaveTarget = resolveSaveTarget(channel, urlParams);

  return { channel, executionMode, storageMode, saveTarget };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveChannel(
  isInIframe: boolean,
  urlParams: URLSearchParams,
  isAuthenticated: boolean,
  embedToken?: string,
): RuntimeChannel {
  // Explicit embed: in iframe OR URL says mode=embedded
  if (isInIframe || urlParams.get('mode') === 'embedded') {
    return 'embed';
  }

  // Embed token on the URL also means embed channel
  if (embedToken) {
    return 'embed';
  }

  // Browser mode: authenticated user
  if (isAuthenticated) {
    return 'browser';
  }

  // No auth, not embedded → guest / demo
  return 'guest';
}

function resolveStorageMode(channel: RuntimeChannel, isAuthenticated: boolean): StorageMode {
  // Embed channel always uses cloud (the host or self backend persists)
  if (channel === 'embed') {
    return 'cloud';
  }
  // Authenticated browser → cloud
  if (channel === 'browser' && isAuthenticated) {
    return 'cloud';
  }
  // Guest or unauthenticated → local (IndexedDB)
  return 'local';
}

function resolveSaveTarget(channel: RuntimeChannel, urlParams: URLSearchParams): SaveTarget {
  if (channel !== 'embed') {
    return 'self';
  }
  // In embed mode, the host can declare save target via URL param
  const targetParam = urlParams.get('saveTarget');
  if (targetParam === 'host') {
    return 'host';
  }
  // Default for embed: self-managed
  return 'self';
}
