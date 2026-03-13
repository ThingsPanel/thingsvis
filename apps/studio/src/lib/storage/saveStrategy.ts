/**
 * Save Strategy Manager
 *
 * Unified management of save strategies across different scenarios:
 *
 * Scenario 1: Standalone execution
 *   - Authenticated user: Save to ThingsVis Cloud API
 *   - Unauthenticated user: Save to local IndexedDB
 *
 * Scenario 2: Embedded Host-managed (target=host)
 *   - Dispatch 'tv:save' message to host
 *   - Host engine receives and saves to its payload/field
 *
 * Scenario 3: Embedded Self-managed (target=self)
 *   - Save to ThingsVis Cloud API
 *   - Utilize dashboard ID provided by the host
 */

import { useSyncExternalStore, useCallback } from 'react';
import { isEmbedMode, requestSave as sendToHost } from '../../embed/message-router';

// =============================================================================
// Types
// =============================================================================

export type SaveTarget = 'self' | 'host';
export type StorageBackend = 'local' | 'cloud';

export interface SaveStrategyConfig {
  /** Target destination for saving: self=ThingsVis Backend, host=Host Platform */
  saveTarget: SaveTarget;
  /** Storage backend mechanism: local=IndexedDB, cloud=ThingsVis API */
  storageBackend: StorageBackend;
  /** Indicates if currently running in embedded mode */
  isEmbedded: boolean;
  /** Project ID passed from the host (embedded mode) */
  embeddedProjectId?: string;
  /** Project name passed from the host */
  embeddedProjectName?: string;
}

export interface SavePayload {
  meta?: {
    id?: string;
    name?: string;
    version?: string;
  };
  canvas: {
    mode: string;
    width: number;
    height: number;
    /** Stored as PageBackground object or legacy CSS string. */
    background?: string | Record<string, unknown>;
    gridCols?: number;
    gridRowHeight?: number;
    gridGap?: number;
    fullWidthPreview?: boolean;
  };
  nodes: Record<string, unknown>[];
  dataSources?: Record<string, unknown>[];
  variables?: Record<string, unknown>[];
  dataBindings?: Record<string, unknown>[];
}

// =============================================================================
// URL Parameter Parsing
// =============================================================================

/**
 * Parse save configuration from URL parameters safely
 */
function parseUrlParams(): Partial<SaveStrategyConfig> {
  const config: Partial<SaveStrategyConfig> = {};

  try {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');

    if (queryIndex >= 0) {
      const params = new URLSearchParams(hash.slice(queryIndex + 1));
      const saveTarget = params.get('saveTarget');
      if (saveTarget === 'host' || saveTarget === 'self') config.saveTarget = saveTarget;

      if (params.get('mode') === 'embedded') config.isEmbedded = true;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchTarget = urlParams.get('saveTarget');
    if (searchTarget === 'host' || searchTarget === 'self') {
      config.saveTarget = searchTarget;
    }
  } catch (e) {
    console.error('[SaveStrategy] Failed to parse URL params:', e);
  }

  return config;
}

// =============================================================================
// State Store Singleton
// =============================================================================

class SaveStrategyStore {
  private config: SaveStrategyConfig = {
    saveTarget: 'self',
    storageBackend: 'local',
    isEmbedded: false,
  };
  private listeners = new Set<() => void>();

  public getSnapshot = (): SaveStrategyConfig => {
    return this.config;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    // Enforce immutability for React's useSyncExternalStore by cloning the object
    this.config = { ...this.config };
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('[SaveStrategy] Listener error:', e);
      }
    });
  }

  public init(options?: {
    isAuthenticated?: boolean;
    embeddedProjectId?: string;
    embeddedProjectName?: string;
  }): void {
    const urlConfig = parseUrlParams();
    const isEmbedded = isEmbedMode() || urlConfig.isEmbedded || false;

    let storageBackend: StorageBackend = 'local';
    if (options?.isAuthenticated) {
      storageBackend = 'cloud';
    }

    if (isEmbedded && urlConfig.saveTarget !== 'host') {
      storageBackend = 'cloud';
    }

    this.config = {
      saveTarget: urlConfig.saveTarget || 'self',
      storageBackend,
      isEmbedded,
      embeddedProjectId: options?.embeddedProjectId,
      embeddedProjectName: options?.embeddedProjectName,
    };

    this.notify();
  }

  public updateEmbeddedConfig(config: {
    projectId?: string;
    projectName?: string;
    saveTarget?: SaveTarget;
  }): void {
    this.config.isEmbedded = true;

    if (config.projectId) this.config.embeddedProjectId = config.projectId;
    if (config.projectName) this.config.embeddedProjectName = config.projectName;
    if (config.saveTarget) {
      this.config.saveTarget = config.saveTarget;
      if (config.saveTarget === 'self') {
        this.config.storageBackend = 'cloud';
      }
    }

    this.notify();
  }
}

const store = new SaveStrategyStore();

// =============================================================================
// Public API
// =============================================================================

export const initSaveStrategy = (options?: {
  isAuthenticated?: boolean;
  embeddedProjectId?: string;
  embeddedProjectName?: string;
}) => store.init(options);

export const updateEmbeddedConfig = (config: {
  projectId?: string;
  projectName?: string;
  saveTarget?: SaveTarget;
}) => store.updateEmbeddedConfig(config);

export const getSaveStrategy = () => store.getSnapshot();

export const subscribe = store.subscribe;

export function shouldSaveToHost(): boolean {
  const state = store.getSnapshot();
  return state.isEmbedded && state.saveTarget === 'host';
}

export function shouldSaveToCloud(): boolean {
  const state = store.getSnapshot();
  return state.storageBackend === 'cloud' || (state.isEmbedded && state.saveTarget === 'self');
}

export function getEffectiveProjectId(fallbackId: string): string {
  const state = store.getSnapshot();
  if (state.isEmbedded && state.embeddedProjectId) {
    return state.embeddedProjectId;
  }
  return fallbackId;
}

export async function executeSave(
  payload: SavePayload,
): Promise<{ success: boolean; error?: string }> {
  if (shouldSaveToHost()) {
    try {
      sendToHost(payload);
      return { success: true };
    } catch (error) {
      console.error('[SaveStrategy] Failed to save to host:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { success: true };
}

// =============================================================================
// React Hook Adapter
// =============================================================================

export function useSaveStrategy(): SaveStrategyConfig {
  return useSyncExternalStore(
    useCallback((callback) => store.subscribe(callback), []),
    store.getSnapshot,
    store.getSnapshot,
  );
}
