/**
 * useAutoSave Hook
 * 
 * React hook for integrating auto-save with the kernel store.
 * Tracks state changes and triggers auto-save accordingly.
 */

import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react'
import { autoSaveManager } from '../lib/storage/autoSave'
import { projectStorage } from '../lib/storage/projectStorage'
import type { SaveState } from '../lib/storage/types'
import type { ProjectFile } from '../lib/storage/schemas'
import { useStorage } from './useStorage'
import type { StorageProject } from '../lib/storage/adapter'

// =============================================================================
// Hook Options
// =============================================================================

export interface UseAutoSaveOptions {
  /** Project ID to save */
  projectId: string
  /** Backend project ID for cloud storage (optional) */
  cloudProjectId?: string
  /** Function to get current project state */
  getProjectState: () => ProjectFile
  /** Whether auto-save is enabled */
  enabled?: boolean
  /** Callback when a new storage ID is assigned */
  onIdChange?: (newId: string) => void
}

// =============================================================================
// useAutoSave Hook
// =============================================================================

/**
 * Hook for automatic project saving.
 * Returns save state and methods to trigger save operations.
 */
export function useAutoSave(options: UseAutoSaveOptions) {
  const { projectId, cloudProjectId, getProjectState, enabled = true, onIdChange } = options
  const storage = useStorage(cloudProjectId)

  const saveProject = useCallback(
    async (project: ProjectFile) => {
      if (storage.isCloud) {
        const storageProject: StorageProject = {
          meta: {
            id: project.meta.id,
            name: project.meta.name,
            thumbnail: project.meta.thumbnail,
            createdAt: project.meta.createdAt,
            updatedAt: project.meta.updatedAt,
          },
          schema: {
            canvas: project.canvas,
            nodes: project.nodes,
            dataSources: project.dataSources,
          },
        }
        const result = await storage.save(storageProject)
        if (result?.id && result.id !== project.meta.id) {
          onIdChange?.(result.id)
        }
        return
      }

      await projectStorage.save(project)
    },
    [storage, onIdChange]
  )

  // Keep latest getter without causing AutoSaveManager re-init (which would cancel debounce timers)
  const getProjectStateRef = useRef(getProjectState)
  useEffect(() => {
    getProjectStateRef.current = getProjectState
  }, [getProjectState])

  // Subscribe to save state changes
  const saveState = useSyncExternalStore(
    useCallback(
      (callback) => autoSaveManager.subscribe(callback),
      []
    ),
    () => autoSaveManager.getStatus(),
    () => autoSaveManager.getStatus()
  )

  // Initialize auto-save manager
  useEffect(() => {
    if (!enabled) return

    autoSaveManager.init(projectId, () => getProjectStateRef.current(), saveProject)

    return () => {
      autoSaveManager.destroy()
    }
  }, [projectId, enabled, saveProject])

  // Mark dirty - call this when state changes
  const markDirty = useCallback(() => {
    if (enabled) {
      autoSaveManager.markDirty()
    }
  }, [enabled])

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (enabled) {
      await autoSaveManager.saveNow()
    }
  }, [enabled])

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return autoSaveManager.hasUnsavedChanges()
  }, [])

  return {
    /** Current save status */
    saveState,
    /** Mark the project as dirty (triggers debounced save) */
    markDirty,
    /** Force immediate save */
    saveNow,
    /** Check if there are unsaved changes */
    hasUnsavedChanges,
  }
}

// =============================================================================
// useProject Hook
// =============================================================================

export interface UseProjectOptions {
  /** Initial project ID (optional - will create new if not provided) */
  projectId?: string
  /** Initial project name for new projects */
  projectName?: string
}

/**
 * Hook for managing the current project.
 * Handles loading, saving, and state management.
 */
export function useProject(options: UseProjectOptions = {}) {
  // Note: This is a placeholder for now
  // Full implementation would integrate with kernel store

  const loadProject = useCallback(async (id: string) => {
    return await projectStorage.load(id)
  }, [])

  const createProject = useCallback((name?: string) => {
    return projectStorage.createNew(name)
  }, [])

  return {
    loadProject,
    createProject,
  }
}
