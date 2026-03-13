/**
 * useProjects Hook
 * 
 * Provides access to project management operations.
 * Wraps the projects API client with React hooks patterns.
 */

import { useState, useCallback, useEffect } from 'react';
import * as projectsApi from '@/lib/api/projects';

export interface UseProjectsOptions {
  /** Automatically load projects on mount */
  autoLoad?: boolean;
  /** Page size for pagination */
  pageSize?: number;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { autoLoad = false, pageSize = 20 } = options;

  const [projects, setProjects] = useState<projectsApi.ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Load projects list
  const loadProjects = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.listProjects({ page, limit: pageSize });
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data) {
        setProjects(response.data.data);
        setTotal(response.data.meta.total);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Create a new project
  const createProject = useCallback(async (data: projectsApi.CreateProjectData) => {
    setError(null);
    try {
      const response = await projectsApi.createProject(data);
      if (response.error) {
        setError(response.error);
        return null;
      }
      if (response.data) {
        // Reload projects list to include new project
        await loadProjects(currentPage);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    }
  }, [loadProjects, currentPage]);

  // Update a project
  const updateProject = useCallback(async (
    id: string,
    data: projectsApi.UpdateProjectData
  ) => {
    setError(null);
    try {
      const response = await projectsApi.updateProject(id, data);
      if (response.error) {
        setError(response.error);
        return null;
      }
      if (response.data) {
        // Update local state
        setProjects(prev =>
          prev.map(p => (p.id === id ? { ...p, ...data } : p))
        );
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return null;
    }
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    setError(null);
    try {
      const response = await projectsApi.deleteProject(id);
      if (response.error) {
        setError(response.error);
        return false;
      }
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    }
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadProjects(1);
    }
  }, [autoLoad, loadProjects]);

  return {
    projects,
    isLoading,
    error,
    total,
    currentPage,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
