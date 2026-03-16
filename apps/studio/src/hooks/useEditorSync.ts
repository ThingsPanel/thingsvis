import { useEffect, useRef } from 'react';
import { useAutoSave } from './useAutoSave';
import { store } from '../lib/store';
import { STORAGE_CONSTANTS } from '../lib/storage/constants';
import type { ProjectFile } from '../lib/storage/schemas';
import type { CanvasConfigSchema } from './useProjectBootstrap';

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
  const autoSaveEnabled = !isBootstrapping && (!isWidgetMode || projectId !== 'widget');

  // Auto-save hook
  const { saveState, markDirty, saveNow } = useAutoSave({
    projectId,
    cloudProjectId,
    getProjectState,
    enabled: autoSaveEnabled, // Keep host-managed dashboard editor savable; only disable legacy widget mode.
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
    if (!canvasInitializedRef.current) {
      canvasInitializedRef.current = true;
      return;
    }
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
  ]);

  // Sync background changes to kernel store
  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    if (!canvasConfig.background || typeof canvasConfig.background !== 'object') return;
    store.getState().updatePageConfig({ background: canvasConfig.background } as any);
  }, [canvasConfig.background, isBootstrapping, bootstrappingRef]);

  // Sync theme changes to kernel store
  useEffect(() => {
    if (isBootstrapping || bootstrappingRef.current) return;
    if (!canvasConfig.theme) return;
    store.getState().updatePageConfig({ theme: canvasConfig.theme } as any);
  }, [canvasConfig.theme, isBootstrapping, bootstrappingRef]);

  // Subscribe to store node changes, automatically trigger markDirty
  useEffect(() => {
    if (isBootstrapping) return;

    const state = store.getState();
    let prevNodesById: any = state.nodesById;
    let prevLayerOrder: any = state.layerOrder;
    let prevDataSourceStates: any = (state as any).dataSourceStates;
    let prevVariableDefinitions: any = state.variableDefinitions;
    let prevCanvas: any = state.canvas;

    const unsubscribe = store.subscribe(() => {
      if (bootstrappingRef.current) return;

      const currentState = store.getState();
      const nodesById = currentState.nodesById;
      const layerOrder = currentState.layerOrder;
      const dataSourceStates = (currentState as any).dataSourceStates;
      const variableDefinitions = currentState.variableDefinitions;
      const canvas = currentState.canvas;

      // Compare references (zustand creates new references on state change)
      if (
        nodesById !== prevNodesById ||
        layerOrder !== prevLayerOrder ||
        dataSourceStates !== prevDataSourceStates ||
        variableDefinitions !== prevVariableDefinitions ||
        canvas !== prevCanvas
      ) {
        prevNodesById = nodesById;
        prevLayerOrder = layerOrder;
        prevDataSourceStates = dataSourceStates;
        prevVariableDefinitions = variableDefinitions;
        prevCanvas = canvas;
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
    });
    syncingRef.current = false;
  }, [canvasConfig.mode, canvasConfig.width, canvasConfig.height]);

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
    });
  }, [canvasConfig.gridCols, canvasConfig.gridRowHeight, canvasConfig.gridGap]);

  return { saveState, markDirty, saveNow };
}
