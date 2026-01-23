/**
 * ProjectContext
 * 
 * Manages the currently selected project for the application.
 * Loads the last selected project when user logs in.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import * as projectsApi from '@/lib/api/projects';
import type { Project } from '@/lib/api/projects';
import { STORAGE_CONSTANTS } from '@/lib/storage/constants';

// Match the token key used in AuthContext
const TOKEN_KEY = 'thingsvis_token';

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
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load or create default project when user logs in
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('[ProjectContext] Waiting for auth to complete...');
      return;
    }

    // Check token in localStorage first (more reliable than state during login)
    const storedToken = localStorage.getItem('thingsvis_token');
    const hasToken = !!storedToken;
    
    console.log('[ProjectContext] Auth check:', {
      isAuthenticated,
      hasToken,
      authLoading,
    });

    // If no token in localStorage, clear project
    if (!hasToken) {
      console.log('[ProjectContext] No token found, clearing project');
      setCurrentProject(null);
      localStorage.removeItem(CURRENT_PROJECT_KEY);
      return;
    }
    
    // If we have token but not authenticated yet, wait for auth to complete
    if (!isAuthenticated && hasToken) {
      console.log('[ProjectContext] Has token but not authenticated yet, waiting...');
      return;
    }

    const initializeProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[ProjectContext] Initializing project...');
        
        // Try to load saved project ID
        const savedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
        console.log('[ProjectContext] Saved project ID:', savedProjectId);
        
        // Load projects list using API
        console.log('[ProjectContext] Fetching projects from API...');
        const projectsResponse = await projectsApi.listProjects({ page: 1, limit: 20 });

        console.log('[ProjectContext] Projects API response:', {
          hasError: !!projectsResponse.error,
          hasData: !!projectsResponse.data,
          error: projectsResponse.error,
        });

        if (projectsResponse.error || !projectsResponse.data) {
          throw new Error(projectsResponse.error || 'Failed to load projects');
        }

        const fetchedProjects = projectsResponse.data.data || [];
        console.log('[ProjectContext] Fetched projects count:', fetchedProjects.length);
        
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
          console.log('[ProjectContext] Loading project:', projectToLoad.name, projectToLoad.id);
          
          // Load full project details
          const projectResponse = await projectsApi.getProject(projectToLoad.id);
          
          console.log('[ProjectContext] Project details response:', {
            hasError: !!projectResponse.error,
            hasData: !!projectResponse.data,
          });
          
          if (projectResponse.data) {
            const projectData = projectResponse.data;
            setCurrentProject(projectData);
            localStorage.setItem(CURRENT_PROJECT_KEY, projectData.id);
            console.log('[ProjectContext] ✓ Project loaded successfully:', projectData.name);
          }
        } else {
          // No projects exist - require user to create one
          console.log('[ProjectContext] No projects found, waiting for user to create project');
          setCurrentProject(null);
          localStorage.removeItem(CURRENT_PROJECT_KEY);
        }
      } catch (err) {
        console.error('[ProjectContext] Failed to initialize project:', err);
        setError(err instanceof Error ? err.message : '初始化项目失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeProject();
  }, [isAuthenticated, authLoading]); // Removed loadProjects and createProject

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

  const createAndSwitchProject = useCallback(async (
    name: string,
    description?: string
  ) => {
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

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
