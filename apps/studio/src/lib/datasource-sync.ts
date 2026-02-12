/**
 * Initialize data source synchronization based on authentication state
 * This module handles switching between local-only and cloud-sync modes
 */

import { dataSourceManager, ApiSyncAdapter, NoopSyncAdapter } from '@thingsvis/kernel';
import type { DataSource } from '@thingsvis/schema';

let currentMode: 'local' | 'cloud' = 'local';

/**
 * Wrapper adapter for API client that matches ApiSyncAdapter interface
 */
class ApiClientWrapper {
    constructor(private apiClient: any) { }

    async get<T>(path: string): Promise<{ success?: boolean; data?: T; error?: string }> {
        const response = await this.apiClient.get<T>(path);
        return {
            success: !response.error,
            data: response.data,
            error: response.error
        };
    }

    async post<T>(path: string, data: any): Promise<{ success?: boolean; data?: T; error?: string }> {
        const response = await this.apiClient.post<T>(path, data);
        return {
            success: !response.error,
            data: response.data,
            error: response.error
        };
    }

    async delete<T>(path: string): Promise<{ success?: boolean; data?: T; error?: string }> {
        const response = await this.apiClient.delete<T>(path);
        return {
            success: !response.error,
            data: response.data,
            error: response.error
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


}
