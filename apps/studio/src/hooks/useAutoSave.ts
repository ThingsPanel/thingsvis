/**
 * useAutoSave Hook
 *
 * React hook for integrating auto-save with the kernel store.
 */

import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react';
import { autoSaveManager } from '../lib/storage/autoSave';
import { projectStorage } from '../lib/storage/projectStorage';
import type { ProjectFile } from '../lib/storage/schemas';
import { useStorage } from './useStorage';
import type { StorageProject } from '../lib/storage/adapter';
import {
  shouldSaveToHost,
  getEffectiveProjectId,
  useSaveStrategy,
} from '../lib/storage/saveStrategy';
import { notifyChange, requestSave as sendToHost } from '../embed/message-router';
import { setEmbedSessionSnapshot } from '../lib/embed/sessionSnapshot';
import { buildHostSavePayload, prepareProjectForHostSave } from '../lib/storage/hostSavePayload';

export interface UseAutoSaveOptions {
  /** Project ID to save */
  projectId: string;
  /** Backend project ID for cloud storage (optional) */
  cloudProjectId?: string;
  /** Function to get current project state */
  getProjectState: () => ProjectFile;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Save behavior: auto saves on dirty, manual only saves on explicit saveNow() */
  saveMode?: 'auto' | 'manual';
  /** Callback when a new storage ID is assigned */
  onIdChange?: (newId: string) => void;
}

/**
 * Hook for automatic project saving.
 * Returns save state and methods to trigger save operations.
 */
export function useAutoSave(options: UseAutoSaveOptions) {
  const {
    projectId,
    cloudProjectId,
    getProjectState,
    enabled = true,
    saveMode = 'auto',
    onIdChange,
  } = options;
  const storage = useStorage(cloudProjectId);
  const saveStrategy = useSaveStrategy();

  const saveProject = useCallback(
    async (project: ProjectFile) => {
      const projectForSave = prepareProjectForHostSave(project);

      if (shouldSaveToHost()) {
        const { projectForSave: hostProject, payload } = buildHostSavePayload(project);
        setEmbedSessionSnapshot(hostProject.meta.id, hostProject, 'host-save');
        sendToHost(payload);
        return;
      }

      const effectiveId = getEffectiveProjectId(projectForSave.meta.id);

      if (storage.isCloud) {
        const storageProject: StorageProject = {
          meta: {
            id: effectiveId,
            name: projectForSave.meta.name,
            thumbnail: projectForSave.meta.thumbnail,
            createdAt: projectForSave.meta.createdAt,
            updatedAt: projectForSave.meta.updatedAt,
          },
          schema: {
            canvas: projectForSave.canvas,
            nodes: projectForSave.nodes,
            dataSources: projectForSave.dataSources,
            variables: projectForSave.variables,
          },
        };
        const result = await storage.save(storageProject);
        if (result?.id && result.id !== projectForSave.meta.id) {
          onIdChange?.(result.id);
        }
        return;
      }

      await projectStorage.save(projectForSave);
    },
    [storage, onIdChange, saveStrategy],
  );

  const saveProjectRef = useRef(saveProject);
  useEffect(() => {
    saveProjectRef.current = saveProject;
  }, [saveProject]);

  const getProjectStateRef = useRef(getProjectState);
  useEffect(() => {
    getProjectStateRef.current = getProjectState;
  }, [getProjectState]);

  const saveState = useSyncExternalStore(
    useCallback((callback) => autoSaveManager.subscribe(callback), []),
    () => autoSaveManager.getStatus(),
    () => autoSaveManager.getStatus(),
  );

  useEffect(() => {
    if (!enabled) return;

    autoSaveManager.init(
      projectId,
      () => getProjectStateRef.current(),
      (project) => saveProjectRef.current(project),
      {
        mode: saveMode,
        onDirtyChange: notifyChange,
      },
    );

    return () => {
      autoSaveManager.destroy();
    };
  }, [projectId, enabled, saveMode]);

  const markDirty = useCallback(
    (immediate = false) => {
      if (enabled) {
        if (immediate) {
          autoSaveManager.saveNow(true);
        } else {
          autoSaveManager.markDirty();
        }
      }
    },
    [enabled],
  );

  const saveNow = useCallback(async () => {
    if (enabled) {
      await autoSaveManager.saveNow(true);
    }
  }, [enabled]);

  const hasUnsavedChanges = useCallback(() => {
    return autoSaveManager.hasUnsavedChanges();
  }, []);

  return {
    /** Current save status */
    saveState,
    /** Mark the project as dirty (triggers debounced save) */
    markDirty,
    /** Force immediate save */
    saveNow,
    /** Check if there are unsaved changes */
    hasUnsavedChanges,
  };
}

export interface UseProjectOptions {
  /** Initial project ID (optional - will create new if not provided) */
  projectId?: string;
  /** Initial project name for new projects */
  projectName?: string;
}

/**
 * Hook for managing the current project.
 * Handles loading, saving, and state management.
 */
export function useProject(options: UseProjectOptions = {}) {
  // Keep the parameter for API compatibility with existing consumers.
  void options;

  const loadProject = useCallback(async (id: string) => {
    return await projectStorage.load(id);
  }, []);

  const createProject = useCallback((name?: string) => {
    return projectStorage.createNew(name);
  }, []);

  return {
    loadProject,
    createProject,
  };
}
