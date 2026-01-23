/**
 * useStorage Hook
 * 
 * Provides a unified interface for storage operations that automatically
 * switches between local and cloud storage based on authentication state.
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { localStorageAdapter, createCloudStorageAdapter, type StorageAdapter, type StorageProject, type ListOptions, type ListResult, type StorageProjectMeta } from '@/lib/storage/adapter';

export interface UseStorageResult {
  // Current storage backend
  backend: 'local' | 'cloud';
  
  // Storage operations
  list: (options?: ListOptions) => Promise<ListResult<StorageProjectMeta>>;
  get: (id: string) => Promise<StorageProject | null>;
  save: (project: StorageProject) => Promise<{ id: string }>;
  delete: (id: string) => Promise<boolean>;
  duplicate: (id: string, newName: string) => Promise<{ id: string }>;
  exportProject: (id: string) => Promise<Blob>;
  importProject: (file: File) => Promise<{ id: string }>;
  
  // Helper methods
  isCloud: boolean;
  isLocal: boolean;
}

/**
 * Hook to get the appropriate storage adapter based on auth state.
 * 
 * @param projectId - Optional project ID for cloud storage operations
 * @returns Storage operations and current backend type
 */
export function useStorage(projectId?: string): UseStorageResult {
  const { isAuthenticated, storageMode } = useAuth();
  
  // Get the appropriate adapter based on auth state
  const adapter: StorageAdapter = useMemo(() => {
    const shouldUseCloud = isAuthenticated && storageMode === 'cloud';
    console.log('[useStorage] Selecting adapter:', {
      isAuthenticated,
      storageMode,
      shouldUseCloud,
      projectId,
    });
    
    if (shouldUseCloud) {
      return createCloudStorageAdapter(projectId);
    }
    return localStorageAdapter;
  }, [isAuthenticated, storageMode, projectId]);

  const backend = adapter.backend;
  const isCloud = backend === 'cloud';
  const isLocal = backend === 'local';

  // Wrap adapter methods to ensure stable references
  const list = useCallback(
    (options?: ListOptions) => adapter.list(options),
    [adapter]
  );

  const get = useCallback(
    (id: string) => adapter.get(id),
    [adapter]
  );

  const save = useCallback(
    (project: StorageProject) => adapter.save(project),
    [adapter]
  );

  const deleteProject = useCallback(
    (id: string) => adapter.delete(id),
    [adapter]
  );

  const duplicate = useCallback(
    (id: string, newName: string) => {
      if (adapter.duplicate) {
        return adapter.duplicate(id, newName);
      }
      throw new Error('Duplicate not supported');
    },
    [adapter]
  );

  const exportProject = useCallback(
    (id: string) => {
      if (adapter.export) {
        return adapter.export(id);
      }
      throw new Error('Export not supported');
    },
    [adapter]
  );

  const importProject = useCallback(
    (file: File) => {
      if (adapter.import) {
        return adapter.import(file);
      }
      throw new Error('Import not supported');
    },
    [adapter]
  );

  return {
    backend,
    list,
    get,
    save,
    delete: deleteProject,
    duplicate,
    exportProject,
    importProject,
    isCloud,
    isLocal,
  };
}

export default useStorage;
