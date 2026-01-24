/**
 * Project API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  tenantId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { dashboards: number };
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  thumbnail?: string;
}

export interface ProjectListResponse {
  data: ProjectListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List projects
 */
export async function listProjects(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<ProjectListResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  const query = searchParams.toString();
  return apiClient.get<ProjectListResponse>(`/projects${query ? `?${query}` : ''}`);
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<ApiResponse<Project>> {
  return apiClient.get<Project>(`/projects/${id}`);
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
  return apiClient.post<Project>('/projects', data);
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: UpdateProjectData
): Promise<ApiResponse<Project>> {
  return apiClient.put<Project>(`/projects/${id}`, data);
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/projects/${id}`);
}
