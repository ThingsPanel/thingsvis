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
 * Hook to get the appropriate storage adapter based on auth state and save strategy.
 * 
 * @param projectId - Optional project ID for cloud storage operations
 * @returns Storage operations and current backend type
 */
export function useStorage(projectId?: string): UseStorageResult {
  const { isAuthenticated, storageMode } = useAuth();

  // Get the appropriate adapter based on auth state and save strategy
  const adapter: StorageAdapter = useMemo(() => {
    /**
     * 存储后端选择逻辑:
     * 
     * 1. 独立运行 + 已登录 → 云端存储
     * 2. 独立运行 + 未登录 → 本地存储 (IndexedDB)
     * 3. 嵌入模式 + saveTarget=self → 云端存储 (ThingsVis API)
     * 4. 嵌入模式 + saveTarget=host → 由 SaveStrategy 处理 postMessage
     */

    // 嵌入模式: 优先使用云端 (除非明确要保存到宿主)
    if (storageMode === 'embed') {
      // 嵌入模式总是尝试使用云端存储
      // saveTarget=host 的情况由 SaveStrategy.executeSave 处理

      return createCloudStorageAdapter(projectId);
    }

    // 独立运行: 根据认证状态选择
    const shouldUseCloud = isAuthenticated && storageMode === 'cloud';



    if (shouldUseCloud) {
      return createCloudStorageAdapter(projectId);
    }

    // 未登录独立运行: 使用本地存储
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
