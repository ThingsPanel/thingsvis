/**
 * Data Source synchronization adapters
 * Abstracts the backend storage mechanism for data sources
 */

import type { DataSource } from '@thingsvis/schema';

/**
 * Interface for backend sync adapter
 */
export interface DataSourceSyncAdapter {
  /**
   * Load all data sources from remote backend
   */
  loadAll(): Promise<DataSource[]>;

  /**
   * Save a data source to remote backend
   */
  save(config: DataSource): Promise<void>;

  /**
   * Delete a data source from remote backend
   */
  delete(id: string): Promise<void>;
}

/**
 * No-op adapter for offline/local-only mode
 */
export class NoopSyncAdapter implements DataSourceSyncAdapter {
  async loadAll(): Promise<DataSource[]> {
    return [];
  }

  async save(_config: DataSource): Promise<void> {
    // No-op
  }

  async delete(_id: string): Promise<void> {
    // No-op
  }
}

/**
 * API-based sync adapter
 * Uses the REST API to sync data sources
 */
export class ApiSyncAdapter implements DataSourceSyncAdapter {
  constructor(
    private apiClient: {
      get: (path: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      post: (
        path: string,
        data: unknown,
      ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      put: (
        path: string,
        data: unknown,
      ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      delete: (path: string) => Promise<{ success: boolean; error?: string }>;
    },
  ) {}

  async loadAll(): Promise<DataSource[]> {
    const response = await this.apiClient.get('/datasources');

    if (!response.success) {
      throw new Error(response.error || 'Failed to load data sources');
    }

    // Parse legacy or backend records
    const datasources = (response.data as Array<Record<string, unknown>>) || [];
    const leakedManagedSources = datasources.filter(
      (ds) => typeof ds.id === 'string' && /^(?:__platform_.+__|thingspanel_.+)$/.test(ds.id),
    );
    await Promise.allSettled(
      leakedManagedSources.map((ds) => this.apiClient.delete(`/datasources/${ds.id}`)),
    );

    return datasources
      .filter((ds) => !leakedManagedSources.includes(ds))
      .map((ds: Record<string, unknown>) => {
        let mode = ds.mode;
        // Extract mode if it was stashed inside the config JSON
        // because the backend DTO lacks the root `mode` column
        if (ds.config && typeof ds.config === 'object' && '_sys_mode' in ds.config) {
          mode = (ds.config as Record<string, unknown>)._sys_mode;
          delete (ds.config as Record<string, unknown>)._sys_mode;
        }
        return {
          ...ds,
          mode: mode,
        } as unknown as DataSource;
      });
  }

  async save(config: DataSource): Promise<void> {
    // Deep clone config to avoid mutating the original reference
    const stashedConfig = JSON.parse(JSON.stringify(config.config || {}));
    const modeValue = 'mode' in config ? (config as { mode?: string }).mode : undefined;

    if (modeValue) {
      stashedConfig._sys_mode = modeValue;
    }

    const payload = {
      id: config.id,
      name: config.name,
      type: config.type,
      config: stashedConfig,
      transformation: config.transformation,
      mode: modeValue, // Passed anyway in case of future backend support
    };

    // Upsert: try update (PUT) first, fall back to create (POST) if not found
    const updateResponse = await this.apiClient.put(`/datasources/${config.id}`, payload);
    if (updateResponse.success) return;

    // Update failed (likely 404 — does not exist yet), try create
    const createResponse = await this.apiClient.post('/datasources', payload);
    if (!createResponse.success) {
      throw new Error(createResponse.error || 'Failed to save data source');
    }
  }

  async delete(id: string): Promise<void> {
    const response = await this.apiClient.delete(`/datasources/${id}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete data source');
    }
  }
}
