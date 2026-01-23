/**
 * Dashboard API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Dashboard {
  id: string;
  name: string;
  version: number;
  canvasConfig: {
    mode: string;
    width: number;
    height: number;
    background: string;
  };
  nodes: unknown[];
  dataSources: unknown[];
  isPublished: boolean;
  publishedAt: string | null;
  shareToken: string | null;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardListItem {
  id: string;
  name: string;
  version: number;
  isPublished: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  createdBy?: { id: string; name: string };
}

export interface CreateDashboardData {
  name: string;
  projectId: string;
  canvasConfig?: {
    mode?: string;
    width?: number;
    height?: number;
    background?: string;
  };
}

export interface UpdateDashboardData {
  name?: string;
  canvasConfig?: unknown;
  nodes?: unknown[];
  dataSources?: unknown[];
}

export interface DashboardListResponse {
  data: DashboardListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List dashboards
 */
export async function listDashboards(params?: {
  projectId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<DashboardListResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.projectId) searchParams.set('projectId', params.projectId);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  const query = searchParams.toString();
  return apiClient.get<DashboardListResponse>(`/dashboards${query ? `?${query}` : ''}`);
}

/**
 * Get a single dashboard by ID
 */
export async function getDashboard(id: string): Promise<ApiResponse<Dashboard>> {
  return apiClient.get<Dashboard>(`/dashboards/${id}`);
}

/**
 * Create a new dashboard
 */
export async function createDashboard(data: CreateDashboardData): Promise<ApiResponse<Dashboard>> {
  return apiClient.post<Dashboard>('/dashboards', data);
}

/**
 * Update a dashboard
 */
export async function updateDashboard(
  id: string,
  data: UpdateDashboardData
): Promise<ApiResponse<Dashboard>> {
  return apiClient.put<Dashboard>(`/dashboards/${id}`, data);
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/dashboards/${id}`);
}

/**
 * Publish a dashboard
 */
export async function publishDashboard(id: string): Promise<ApiResponse<Dashboard>> {
  return apiClient.post<Dashboard>(`/dashboards/${id}/publish`);
}

/**
 * Duplicate a dashboard
 */
export async function duplicateDashboard(id: string): Promise<ApiResponse<Dashboard>> {
  return apiClient.post<Dashboard>(`/dashboards/${id}/duplicate`);
}
