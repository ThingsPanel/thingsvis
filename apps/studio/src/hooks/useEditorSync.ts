import { useEffect, useRef } from 'react';
import { useAutoSave } from './useAutoSave';
import { store } from '../lib/store';
import { STORAGE_CONSTANTS } from '../lib/storage/constants';
import type { ProjectFile } from '../lib/storage/schemas';
import type { CanvasConfigSchema } from './useProjectBootstrap';
import { normalizeCanvasBackground } from '../lib/canvasBackground';
import { hasPersistedEditorStateChange } from '../lib/canvasPersistence';

export interface UseEditorSyncProps {
  projectId: string;
  cloudProjectId?: string;
  getProjectState: () => ProjectFile;
  isBootstrapping: boolean;
  isWidgetMode: boolean;
  setCanvasConfig: React.Dispatch<React.SetStateAction<CanvasConfigSchema>>;
  canvasConfig: CanvasConfigSchema;
  canvasInitializedRef: React.MutableRefObject<boolean>;
  bootstrappingRef: React.MutableRefObject<boolean>;
}

export function useEditorSync({
  projectId,
  cloudProjectId,
  getProjectState,
  isBootstrapping,
  isWidgetMode,
  setCanvasConfig,
  canvasConfig,
  canvasInitializedRef,
  bootstrappingRef,
}: UseEditorSyncProps) {
  const autoSaveEnabled = !isBootstrapping;
  const saveMode = isWidgetMode ? 'manual' : 'auto';

  // Auto-save hook
  const { saveState, markDirty, saveNow } = useAutoSave({
    projectId,
    cloudProjectId,
    getProjectState,
    enabled: autoSaveEnabled,
    saveMode,
    onIdChange: (newId) => {
      setCanvasConfig((prev) => ({ ...prev, id: newId }));
      try {
        localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, newId);
      } catch {}
    },
  });

  // Mark dirty on meaningful changes only
  useEffect(() => {
    if (bootstrappingRef.current) return;
    if (!canvasInitializedRef.current) return;
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasConfig.name,
    canvasConfig.mode,
    canvasConfig.width,
    canvasConfig.height,
    canvasConfig.gridCols,
    canvasConfig.gridRowHeight,
    canvasConfig.gridGap,
    canvasConfig.bgValue,
    canvasConfig.gridEnabled,
    canvasConfig.gridSize,
    canvasConfig.thumbnail,
    canvasConfig.background,
    canvasConfig.bgType,
    canvasConfig.bgColor,
    canvasConfig.bgImage,
    canvasConfig.theme,
    canvasConfig.scaleMode,
    canvasConfig.previewAlignY,
  ]);

  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    canvasInitializedRef.current = true;
  }, [isBootstrapping, bootstrappingRef, canvasInitializedRef]);

  // Sync background changes to kernel store
  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    store.getState().updatePageConfig({
      background: normalizeCanvasBackground(canvasConfig.background),
    } as any);
  }, [canvasConfig.background, isBootstrapping, bootstrappingRef]);

  // Sync theme changes to kernel store
  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    if (!canvasConfig.theme) return;
    store.getState().updatePageConfig({ theme: canvasConfig.theme } as any);
  }, [canvasConfig.theme, isBootstrapping, bootstrappingRef]);

  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    if (!canvasConfig.scaleMode) return;
    store.getState().updatePageConfig({ scaleMode: canvasConfig.scaleMode } as any);
  }, [canvasConfig.scaleMode, isBootstrapping, bootstrappingRef]);

  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    if (!canvasConfig.previewAlignY) return;
    store.getState().updatePageConfig({ previewAlignY: canvasConfig.previewAlignY } as any);
  }, [canvasConfig.previewAlignY, isBootstrapping, bootstrappingRef]);

  // Subscribe to store node changes, automatically trigger markDirty
  useEffect(() => {
    if (isBootstrapping) return;

    const state = store.getState();
    let prevPersistedState = {
      nodesById: state.nodesById,
      layerOrder: state.layerOrder,
      variableDefinitions: state.variableDefinitions,
      canvas: state.canvas,
    };

    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      const currentPersistedState = {
        nodesById: currentState.nodesById,
        layerOrder: currentState.layerOrder,
        variableDefinitions: currentState.variableDefinitions,
        canvas: currentState.canvas,
      };

      if (bootstrappingRef.current) {
        prevPersistedState = currentPersistedState;
        return;
      }

      // Compare persisted editor structures only.
      // Canvas viewport changes (zoom/pan) are runtime-only and must not re-mark the project dirty.
      if (hasPersistedEditorStateChange(prevPersistedState, currentPersistedState)) {
        prevPersistedState = currentPersistedState;
        markDirty();
      }
    });

    return unsubscribe;
  }, [isBootstrapping, markDirty, bootstrappingRef]);

  // Bidirectional Canvas Sync
  const syncingRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    store.getState().updateCanvas({
      mode: canvasConfig.mode,
      width: canvasConfig.width,
      height: canvasConfig.height,
      gridEnabled: canvasConfig.gridEnabled,
      gridSize: canvasConfig.gridSize,
    });
    syncingRef.current = false;
  }, [
    canvasConfig.mode,
    canvasConfig.width,
    canvasConfig.height,
    canvasConfig.gridEnabled,
    canvasConfig.gridSize,
  ]);

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      if (syncingRef.current) return;
      const kernelCanvas = state.canvas;
      setCanvasConfig((prev) => {
        if (
          prev.mode === kernelCanvas.mode &&
          prev.width === kernelCanvas.width &&
          prev.height === kernelCanvas.height
        )
          return prev;

        syncingRef.current = true;
        const next = {
          ...prev,
          mode: kernelCanvas.mode,
          width: kernelCanvas.width,
          height: kernelCanvas.height,
        };
        syncingRef.current = false;
        return next;
      });
    });
    return unsubscribe;
  }, [setCanvasConfig]);

  useEffect(() => {
    const { setGridSettings } = store.getState();
    if (!setGridSettings) return;
    setGridSettings({
      cols: canvasConfig.gridCols ?? 24,
      rowHeight: canvasConfig.gridRowHeight ?? 50,
      gap: canvasConfig.gridGap ?? 10,
      showGridLines: canvasConfig.gridEnabled,
    });
  }, [
    canvasConfig.gridCols,
    canvasConfig.gridRowHeight,
    canvasConfig.gridGap,
    canvasConfig.gridEnabled,
  ]);

  return { saveState, markDirty, saveNow };
}
