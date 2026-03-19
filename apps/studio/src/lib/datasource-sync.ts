/**
 * Initialize data source synchronization based on authentication state
 * This module handles switching between local-only and cloud-sync modes
 */

import { ApiSyncAdapter, NoopSyncAdapter } from '@thingsvis/kernel';
import { dataSourceManager } from './store';

let currentMode: 'local' | 'cloud' = 'local';

/**
 * Wrapper adapter for API client that matches ApiSyncAdapter interface
 */
class ApiClientWrapper {
  constructor(
    private apiClient: {
      get: (path: string) => Promise<{ error?: string; data?: unknown }>;
      post: (path: string, data: unknown) => Promise<{ error?: string; data?: unknown }>;
      put: (path: string, data: unknown) => Promise<{ error?: string; data?: unknown }>;
      delete: (path: string) => Promise<{ error?: string; data?: unknown }>;
    },
  ) {}

  async get(path: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const response = await this.apiClient.get(path);
    return {
      success: !response.error,
      data: response.data,
      error: response.error,
    };
  }

  async post(
    path: string,
    data: unknown,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const response = await this.apiClient.post(path, data);
    return {
      success: !response.error,
      data: response.data,
      error: response.error,
    };
  }

  async put(
    path: string,
    data: unknown,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const response = await this.apiClient.put(path, data);
    return {
      success: !response.error,
      data: response.data,
      error: response.error,
    };
  }

  async delete(path: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const response = await this.apiClient.delete(path);
    return {
      success: !response.error,
      data: response.data,
      error: response.error,
    };
  }
}

/**
 * Initialize or update data source sync mode
 * Call this when authentication state changes
 */
export async function initDataSourceSync(isAuthenticated: boolean): Promise<void> {
  const newMode = isAuthenticated ? 'cloud' : 'local';

  // Only reinitialize if mode changed
  if (newMode === currentMode) {
    return;
  }

  currentMode = newMode;

  if (isAuthenticated) {
    try {
      // Dynamically import to avoid circular dependency
      const { apiClient } = await import('./api/client');
      const wrapper = new ApiClientWrapper(apiClient);
      const syncAdapter = new ApiSyncAdapter(wrapper);
      dataSourceManager.setSyncAdapter(syncAdapter);

      // Immediately load all datasources from cloud backend.
      // This is the authoritative source — must be called after setSyncAdapter.
      await dataSourceManager.reloadFromCloud();
    } catch (error) {
      console.error('❌ [DataSourceSync] Failed to initialize cloud sync:', error);
    }
  } else {
    dataSourceManager.setSyncAdapter(new NoopSyncAdapter());
  }
}

/**
 * Force reload data sources from cloud
 * Useful after login to sync existing cloud data
 */
export async function syncDataSourcesFromCloud(): Promise<void> {
  if (currentMode !== 'cloud') {
    console.warn('⚠️ [DataSourceSync] Cannot sync from cloud in local-only mode');
    return;
  }

  await dataSourceManager.reloadFromCloud();
}
