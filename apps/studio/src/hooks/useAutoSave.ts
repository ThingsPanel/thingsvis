/**
 * useAutoSave Hook
 *
 * React hook for integrating auto-save with the kernel store.
 * Tracks state changes and triggers auto-save accordingly.
 *
 * 支持三种场景:
 * 1. 独立运行: 保存到 ThingsVis (云端或本地)
 * 2. 嵌入物模型 (saveTarget=host): 保存到宿主平台
 * 3. 嵌入可视化 (saveTarget=self): 保存到 ThingsVis 云端
 */

import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react';
import { autoSaveManager } from '../lib/storage/autoSave';
import { projectStorage } from '../lib/storage/projectStorage';
import type { SaveState } from '../lib/storage/types';
import type { ProjectFile } from '../lib/storage/schemas';
import { useStorage } from './useStorage';
import type { StorageProject } from '../lib/storage/adapter';
import {
  shouldSaveToHost,
  getEffectiveProjectId,
  useSaveStrategy,
  type SavePayload,
} from '../lib/storage/saveStrategy';
import { notifyChange, requestSave as sendToHost } from '../embed/message-router';
import { setEmbedSessionSnapshot } from '../lib/embed/sessionSnapshot';

// =============================================================================
// Hook Options
// =============================================================================

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

// =============================================================================
// useAutoSave Hook
// =============================================================================

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
      // 场景2: 嵌入物模型 - 保存到宿主平台
      if (shouldSaveToHost()) {
        setEmbedSessionSnapshot(project.meta.id, project, 'host-save');
        const payload: SavePayload = {
          meta: {
            id: project.meta.id,
            name: project.meta.name,
            version: project.meta.version,
          },
          canvas: project.canvas,
          nodes: project.nodes,
          dataSources: project.dataSources,
          variables: project.variables,
          dataBindings: extractDataBindings(project.nodes),
        };
        sendToHost(payload);
        return;
      }

      // 场景1 & 场景3: 保存到 ThingsVis (云端或本地)
      // 使用嵌入模式传来的有效 ID
      const effectiveId = getEffectiveProjectId(project.meta.id);

      if (storage.isCloud) {
        const storageProject: StorageProject = {
          meta: {
            id: effectiveId,
            name: project.meta.name,
            thumbnail: project.meta.thumbnail,
            createdAt: project.meta.createdAt,
            updatedAt: project.meta.updatedAt,
          },
          schema: {
            canvas: project.canvas,
            nodes: project.nodes,
            dataSources: project.dataSources,
            variables: project.variables,
          },
        };
        const result = await storage.save(storageProject);
        if (result?.id && result.id !== project.meta.id) {
          onIdChange?.(result.id);
        }
        return;
      }

      // 本地存储 (未登录独立运行)

      await projectStorage.save(project);
    },
    [storage, onIdChange, saveStrategy],
  );

  // 🔑 关键修复：使用 ref 保存最新的 saveProject 函数，避免 autoSaveManager 重新初始化
  const saveProjectRef = useRef(saveProject);
  useEffect(() => {
    saveProjectRef.current = saveProject;
  }, [saveProject]);

  // Keep latest getter without causing AutoSaveManager re-init (which would cancel debounce timers)
  const getProjectStateRef = useRef(getProjectState);
  useEffect(() => {
    getProjectStateRef.current = getProjectState;
  }, [getProjectState]);

  // Subscribe to save state changes
  const saveState = useSyncExternalStore(
    useCallback((callback) => autoSaveManager.subscribe(callback), []),
    () => autoSaveManager.getStatus(),
    () => autoSaveManager.getStatus(),
  );

  // Initialize auto-save manager - reconfigure when projectId/enabled/saveMode changes
  useEffect(() => {
    if (!enabled) return;

    // 使用 ref 包装的函数，这样 autoSaveManager 始终调用最新的 saveProject
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

  // Mark dirty - call this when state changes
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

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (enabled) {
      await autoSaveManager.saveNow(true);
    }
  }, [enabled]);

  // Check for unsaved changes
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

// =============================================================================
// useProject Hook
// =============================================================================

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
  // Note: This is a placeholder for now
  // Full implementation would integrate with kernel store

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 从节点数据中提取数据绑定信息
 * 用于 saveTarget=host 场景下向宿主传递绑定关系
 */
function extractDataBindings(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return [];

  return nodes.flatMap((node) => {
    const bindings = node.data || [];
    return bindings.map((binding: any) => ({
      nodeId: node.id,
      targetProp: binding.targetProp,
      expression: binding.expression,
      transform: binding.transform,
    }));
  });
}
