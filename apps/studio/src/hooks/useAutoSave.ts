/**
 * useAutoSave Hook
 * 
 * React hook for integrating auto-save with the kernel store.
 * Tracks state changes and triggers auto-save accordingly.
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { autoSaveManager } from '../lib/storage/autoSave'
import { projectStorage } from '../lib/storage/projectStorage'
import type { SaveState } from '../lib/storage/types'
import type { ProjectFile } from '../lib/storage/schemas'

// =============================================================================
// Hook Options
// =============================================================================

export interface UseAutoSaveOptions {
  /** Project ID to save */
  projectId: string
  /** Function to get current project state */
  getProjectState: () => ProjectFile
  /** Whether auto-save is enabled */
  enabled?: boolean
}

// =============================================================================
// useAutoSave Hook
// =============================================================================

/**
 * Hook for automatic project saving.
 * Returns save state and methods to trigger save operations.
 */
export function useAutoSave(options: UseAutoSaveOptions) {
  const { projectId, getProjectState, enabled = true } = options

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

    autoSaveManager.init(projectId, getProjectState)

    return () => {
      autoSaveManager.destroy()
    }
  }, [projectId, enabled, getProjectState])

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
