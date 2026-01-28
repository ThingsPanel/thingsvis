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
            get: (path: string) => Promise<{ success: boolean; data?: any; error?: string }>;
            post: (path: string, data: any) => Promise<{ success: boolean; data?: any; error?: string }>;
            delete: (path: string) => Promise<{ success: boolean; error?: string }>;
        }
    ) { }

    async loadAll(): Promise<DataSource[]> {
        const response = await this.apiClient.get('/datasources');

        if (!response.success) {
            throw new Error(response.error || 'Failed to load data sources');
        }

        return response.data || [];
    }

    async save(config: DataSource): Promise<void> {
        const response = await this.apiClient.post('/datasources', {
            id: config.id,
            name: config.name,
            type: config.type,
            config: config.config,
            transformation: config.transformation
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to save data source');
        }
    }

    async delete(id: string): Promise<void> {
        const response = await this.apiClient.delete(`/datasources/${id}`);

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete data source');
        }
    }
}
