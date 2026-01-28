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

    console.log(`🔄 [DataSourceSync] Current mode: ${currentMode}, New mode: ${newMode}, isAuthenticated: ${isAuthenticated}`);

    // Only reinitialize if mode changed
    if (newMode === currentMode) {
        console.log('⏭️ [DataSourceSync] Mode unchanged, skipping initialization');
        return;
    }

    currentMode = newMode;

    if (isAuthenticated) {
        console.log('📡 [DataSourceSync] Switching to cloud sync mode');
        try {
            // Dynamically import to avoid circular dependency
            const { apiClient } = await import('./api/client');
            const wrapper = new ApiClientWrapper(apiClient);
            const syncAdapter = new ApiSyncAdapter(wrapper);
            dataSourceManager.setSyncAdapter(syncAdapter);
            console.log('✅ [DataSourceSync] Cloud sync adapter initialized successfully');
        } catch (error) {
            console.error('❌ [DataSourceSync] Failed to initialize cloud sync:', error);
        }
    } else {
        console.log('💾 [DataSourceSync] Switching to local-only mode');
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

    console.log('🔄 [DataSourceSync] Data sources will sync from cloud on next load');
}
