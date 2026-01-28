/**
 * Data Source API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface DataSourceDTO {
    id: string;
    name: string;
    type: 'STATIC' | 'REST' | 'WS' | 'PLATFORM_FIELD';
    config: any;  // JSON object
    transformation?: any;  // JSON object
    createdAt: string;
    updatedAt: string;
}

/**
 * Get all data sources for the current user
 */
export async function getDataSources(): Promise<ApiResponse<DataSourceDTO[]>> {
    return apiClient.get<DataSourceDTO[]>('/datasources');
}

/**
 * Get a specific data source by ID
 */
export async function getDataSource(id: string): Promise<ApiResponse<DataSourceDTO>> {
    return apiClient.get<DataSourceDTO>(`/datasources/${id}`);
}

/**
 * Create a new data source
 */
export async function createDataSource(
    data: Omit<DataSourceDTO, 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<DataSourceDTO>> {
    return apiClient.post<DataSourceDTO>('/datasources', data);
}

/**
 * Update an existing data source
 */
export async function updateDataSource(
    id: string,
    data: Partial<Omit<DataSourceDTO, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<DataSourceDTO>> {
    return apiClient.put<DataSourceDTO>(`/datasources/${id}`, data);
}

/**
 * Delete a data source
 */
export async function deleteDataSource(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/datasources/${id}`);
}
