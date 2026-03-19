/**
 * ProjectContext
 *
 * Manages the currently selected project for the application.
 * Loads the last selected project when user logs in.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRuntimeContext } from '@/runtime/RuntimeContextProvider';
import * as projectsApi from '@/lib/api/projects';
import type { Project } from '@/lib/api/projects';
import { STORAGE_CONSTANTS } from '@/lib/storage/constants';

interface ProjectContextValue {
  /** Currently selected project */
  currentProject: Project | null;
  /** Whether project is being loaded */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Switch to a different project */
  switchProject: (projectId: string) => Promise<void>;
  /** Create a new project and switch to it */
  createAndSwitchProject: (name: string, description?: string) => Promise<void>;
  /** Refresh current project data */
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const CURRENT_PROJECT_KEY = STORAGE_CONSTANTS.CURRENT_BACKEND_PROJECT_ID_KEY;

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { channel, storageMode } = useRuntimeContext();

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load or create default project when user logs in
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    const canUseBrowserProjects =
      isAuthenticated && channel === 'browser' && storageMode === 'cloud';

    if (!canUseBrowserProjects) {
      setCurrentProject(null);
      return;
    }

    const initializeProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to load saved project ID
        const savedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);

        // Load projects list using API

        const projectsResponse = await projectsApi.listProjects({ page: 1, limit: 20 });

        if (projectsResponse.error || !projectsResponse.data) {
          throw new Error(projectsResponse.error || 'Failed to load projects');
        }

        const fetchedProjects = projectsResponse.data.data || [];

        // If we have projects
        if (fetchedProjects && fetchedProjects.length > 0) {
          // Try to find saved project
          const savedProject = savedProjectId
            ? fetchedProjects.find((p: any) => p.id === savedProjectId)
            : null;

          // Use saved project or first project
          const projectToLoad = savedProject || fetchedProjects[0];
          if (!projectToLoad) {
            throw new Error('No project to load');
          }

          // Load full project details
          const projectResponse = await projectsApi.getProject(projectToLoad.id);

          if (projectResponse.data) {
            const projectData = projectResponse.data;
            setCurrentProject(projectData);
            localStorage.setItem(CURRENT_PROJECT_KEY, projectData.id);
          }
        } else {
          // No projects exist - require user to create one

          setCurrentProject(null);
          localStorage.removeItem(CURRENT_PROJECT_KEY);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化项目失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeProject();
  }, [channel, authLoading, isAuthenticated, storageMode]);

  const switchProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const projectResponse = await projectsApi.getProject(projectId);

      if (projectResponse.error || !projectResponse.data) {
        throw new Error(projectResponse.error || 'Failed to load project');
      }

      setCurrentProject(projectResponse.data);
      localStorage.setItem(CURRENT_PROJECT_KEY, projectResponse.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换项目失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAndSwitchProject = useCallback(async (name: string, description?: string) => {
    setError(null);

    try {
      const createResponse = await projectsApi.createProject({ name, description });
      const newProject = createResponse.data;
      if (newProject) {
        setCurrentProject(newProject);
        localStorage.setItem(CURRENT_PROJECT_KEY, newProject.id);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建项目失败');
      throw err;
    }
  }, []);

  const refreshProject = useCallback(async () => {
    if (!currentProject) return;
    await switchProject(currentProject.id);
  }, [currentProject, switchProject]);

  const value: ProjectContextValue = {
    currentProject,
    isLoading,
    error,
    switchProject,
    createAndSwitchProject,
    refreshProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
