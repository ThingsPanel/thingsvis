import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DEFAULT_PLATFORM_FIELD_CONFIG,
  validateCanvasTheme,
  type CanvasThemeId,
  type NodeSchemaType,
  type IPageConfig,
  DEFAULT_CANVAS_THEME,
} from '@thingsvis/schema';
import { dataSourceManager } from '@thingsvis/kernel';
import { projectStorage } from '../lib/storage/projectStorage';
import { recentProjects } from '../lib/storage/recentProjects';
import { STORAGE_CONSTANTS } from '../lib/storage/constants';
import { createCloudStorageAdapter } from '../lib/storage/adapter';
import type { ProjectFile } from '../lib/storage/schemas';
import { store } from '../lib/store';
import { useStorage } from './useStorage';
import {
  messageRouter,
  MSG_TYPES,
  onEmbedEvent,
  processEmbedInitPayload,
  type EmbedInitPayload,
} from '../embed/message-router';
import { platformDeviceStore } from '../lib/stores/platformDeviceStore';
import { platformFieldStore } from '../lib/stores/platformFieldStore';

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type CanvasBackground = string | NonNullable<IPageConfig['background']>;

export type CanvasConfigSchema = {
  // Meta - 基础身份
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  thumbnail: string;
  projectName?: string; // Added for display
  scope: 'app' | 'template';
  params: string[];
  createdAt: number;
  createdBy: string;

  // Config - 画布配置
  mode: 'fixed' | 'infinite' | 'grid';
  width: number;
  height: number;
  gridCols?: number;
  gridRowHeight?: number;
  gridGap?: number;
  homeFlag?: boolean; // 是否设为首页
  theme: 'dawn' | 'midnight' | string;
  gridSize: number;
  bgType: 'color' | 'image';
  bgValue: string;
  bgColor: string; // Added for color input
  bgImage: string; // Added for image URL input

  // Global - 全局逻辑
  variables: Record<string, any>;
  dataSources: Array<{ id: string; name: string; type: string; config: any }>;

  // Legacy (保持向后兼容)
  background: CanvasBackground;
  gridEnabled: boolean;
};

export interface UseProjectBootstrapProps {
  embedVisibility: any;
  isAuthenticated: boolean;
  storageMode: string;
  hasSelectedDashboard: boolean;
  setShowProjectDialog: React.Dispatch<React.SetStateAction<boolean>>;
  currentProject: any;
  switchProject: (id: string) => Promise<void>;
}

export interface BootstrapSummary {
  widgetTypes: string[];
  nodeCount: number;
  projectLoaded: boolean;
}

const EMPTY_BOOTSTRAP_SUMMARY: BootstrapSummary = {
  widgetTypes: [],
  nodeCount: 0,
  projectLoaded: false,
};

function createBootstrapSummary(nodes: NodeSchemaType[]): BootstrapSummary {
  const widgetTypes = Array.from(
    new Set(nodes.map((node) => node.type).filter((type): type is string => Boolean(type))),
  );

  return {
    widgetTypes,
    nodeCount: nodes.length,
    projectLoaded: true,
  };
}

function normalizeCanvasMode(mode: unknown): CanvasConfigSchema['mode'] {
  if (mode === 'fixed' || mode === 'infinite' || mode === 'grid') return mode;
  if (mode === 'reflow') return 'infinite';
  return 'fixed';
}

export function useProjectBootstrap({
  embedVisibility,
  isAuthenticated: _isAuthenticated,
  storageMode: _storageMode,
  hasSelectedDashboard: _hasSelectedDashboard,
  setShowProjectDialog: _setShowProjectDialog,
  currentProject,
  switchProject,
}: UseProjectBootstrapProps) {
  const { dashboardId } = useParams<{ dashboardId: string }>();

  // Resolve initial project id from URL/hash, last-opened id, or recents.
  const resolveInitialProjectId = useCallback((): string => {
    if (dashboardId) return dashboardId;
    try {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex >= 0) {
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        const fromHash = params.get('projectId');
        if (fromHash) return fromHash;
        // In host-managed embed mode, don't load a stale local project ID.
        // The real project data will arrive via the tv:init postMessage.
        if (params.get('mode') === 'embedded' && params.get('saveTarget') === 'host') {
          return 'embed-host';
        }
      }
    } catch {}
    try {
      const last = localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY);
      if (last) return last;
    } catch {}
    const recent = recentProjects.get()[0]?.id;
    if (recent) return recent;
    return generateId();
  }, [dashboardId]);

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfigSchema>(() => {
    const initialId = resolveInitialProjectId();
    const defaultMode = 'fixed';
    return {
      id: initialId,
      projectId: '',
      version: '1.0.0',
      name: 'My Visualization',
      description: '',
      thumbnail: '',
      scope: 'app' as 'app' | 'template',
      params: [] as string[],
      createdAt: Date.now(),
      createdBy: 'user-001',
      mode: defaultMode as 'fixed' | 'infinite' | 'grid',
      width: 1920,
      height: 1080,
      gridCols: 24,
      gridRowHeight: 50,
      gridGap: 10,
      theme: DEFAULT_CANVAS_THEME as CanvasThemeId,
      gridSize: 20,
      bgType: 'color' as 'color' | 'image',
      bgValue: '#1a1a1a',
      bgColor: '#1a1a1a',
      bgImage: '',
      variables: {} as Record<string, any>,
      dataSources: [] as Array<{ id: string; name: string; type: string; config: any }>,
      background: '#1a1a1a',
      gridEnabled: true,
    };
  });

  const projectId = canvasConfig.id;
  const bootstrappingRef = useRef(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapSummary, setBootstrapSummary] =
    useState<BootstrapSummary>(EMPTY_BOOTSTRAP_SUMMARY);
  const canvasInitializedRef = useRef(false);

  const storage = useStorage(projectId);

  const getProjectState = useCallback((): ProjectFile => {
    const state = store.getState();
    const nodes = state.layerOrder
      .map((id: string) => state.nodesById[id]?.schemaRef)
      .filter((schema: any): schema is NodeSchemaType => Boolean(schema));

    return {
      meta: {
        version: '1.0.0',
        id: projectId,
        name: canvasConfig.name,
        thumbnail: canvasConfig.thumbnail,
        createdAt: canvasConfig.createdAt,
        updatedAt: Date.now(),
      },
      canvas: {
        mode: canvasConfig.mode,
        width: canvasConfig.width,
        height: canvasConfig.height,
        background: canvasConfig.background ?? canvasConfig.bgValue,
        theme: canvasConfig.theme,
        gridCols: canvasConfig.gridCols,
        gridRowHeight: canvasConfig.gridRowHeight,
        gridGap: canvasConfig.gridGap,
        gridEnabled: canvasConfig.gridEnabled,
        gridSize: canvasConfig.gridSize,
        homeFlag: canvasConfig.homeFlag,
      },
      nodes: nodes,
      dataSources: dataSourceManager.getAllConfigs(),
      variables: state.variableDefinitions ?? [],
    };
  }, [projectId, canvasConfig]);

  // Bootstrap logic
  useEffect(() => {
    let cancelled = false;
    canvasInitializedRef.current = false;
    (async () => {
      bootstrappingRef.current = true;
      setIsBootstrapping(true);

      try {
        let loaded: ProjectFile | null = null;
        setBootstrapSummary(EMPTY_BOOTSTRAP_SUMMARY);
        if (storage.isCloud) {
          const isHostProject =
            embedVisibility.isEmbedded &&
            (projectId === 'widget' || projectId.startsWith('embed-'));

          if (isHostProject) {
            setBootstrapSummary({ ...EMPTY_BOOTSTRAP_SUMMARY, projectLoaded: true });
            bootstrappingRef.current = false;
            setIsBootstrapping(false);
            return;
          }
          try {
            const cloudProject = await storage.get(projectId);
            if (cloudProject) {
              loaded = {
                meta: {
                  version: '1.0.0',
                  id: cloudProject.meta.id,
                  name: cloudProject.meta.name,
                  thumbnail: cloudProject.meta.thumbnail,
                  projectId: cloudProject.meta.projectId,
                  projectName: cloudProject.meta.projectName,
                  createdAt: cloudProject.meta.createdAt,
                  updatedAt: cloudProject.meta.updatedAt,
                },
                canvas: cloudProject.schema.canvas,
                nodes: cloudProject.schema.nodes,
                dataSources: cloudProject.schema.dataSources,
                variables: (cloudProject.schema as any).variables || [],
              };
              if (
                cloudProject.meta.projectId &&
                currentProject?.id !== cloudProject.meta.projectId
              ) {
                switchProject(cloudProject.meta.projectId).catch(console.error);
              }
            }
          } catch (err) {
            console.error('[Editor] Bootstrap: Cloud load failed', err);
          }
        } else {
          loaded = await projectStorage.load(projectId);
        }

        if (cancelled) return;

        if (loaded) {
          setBootstrapSummary(createBootstrapSummary(loaded.nodes));
          store.getState().loadPage({
            id: loaded.meta.id,
            type: 'page' as const,
            version: loaded.meta.version,
            nodes: loaded.nodes,
            config: {
              mode: normalizeCanvasMode(loaded.canvas.mode),
              width: loaded.canvas.width,
              height: loaded.canvas.height,
              theme: validateCanvasTheme((loaded.canvas as any).theme),
            },
          });
          const loadedBackground =
            typeof loaded.canvas.background === 'object' ? loaded.canvas.background : undefined;
          setCanvasConfig((prev) => ({
            ...prev,
            id: loaded.meta.id,
            name: loaded.meta.name,
            thumbnail: loaded.meta.thumbnail || '',
            projectId: loaded.meta.projectId || prev.projectId,
            projectName: loaded.meta.projectName,
            createdAt: loaded.meta.createdAt,
            mode: normalizeCanvasMode(loaded.canvas.mode),
            width: loaded.canvas.width,
            height: loaded.canvas.height,
            theme: validateCanvasTheme((loaded.canvas as any).theme),
            bgValue:
              typeof loaded.canvas.background === 'string'
                ? loaded.canvas.background
                : prev.bgValue,
            background: loadedBackground ?? prev.background,
            gridCols: loaded.canvas.gridCols ?? prev.gridCols,
            gridRowHeight: loaded.canvas.gridRowHeight ?? prev.gridRowHeight,
            gridGap: loaded.canvas.gridGap ?? prev.gridGap,
            gridEnabled: loaded.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: loaded.canvas.gridSize ?? prev.gridSize,
            dataSources: (loaded.dataSources as any) ?? prev.dataSources,
          }));

          if (loadedBackground) {
            store.getState().updatePageConfig({ background: loadedBackground } as any);
          }

          if (loaded.dataSources && Array.isArray(loaded.dataSources)) {
            for (const ds of loaded.dataSources) {
              try {
                await dataSourceManager.registerDataSource(ds as any, false);
              } catch (e) {
                console.warn(`[Editor] Failed to restore data source ${ds.id}:`, e);
              }
            }
          }

          if (loaded.canvas.mode === 'grid') {
            store.getState().setGridSettings({
              cols: loaded.canvas.gridCols ?? 24,
              rowHeight: loaded.canvas.gridRowHeight ?? 50,
              gap: loaded.canvas.gridGap ?? 10,
              compactVertical: true,
              minW: 1,
              minH: 1,
              showGridLines: loaded.canvas.gridEnabled ?? true,
              breakpoints: [],
              responsive: true,
            } as any);
          }

          if (loaded.variables && Array.isArray(loaded.variables)) {
            store.getState().setVariableDefinitions(loaded.variables as any);
            store.getState().initVariablesFromDefinitions(loaded.variables as any);
          }

          try {
            store.temporal.getState().clear?.();
          } catch {}
        } else {
          setBootstrapSummary({
            ...EMPTY_BOOTSTRAP_SUMMARY,
            projectLoaded: true,
          });
          store.getState().loadPage({
            id: projectId,
            type: 'page' as const,
            version: '1.0.0',
            nodes: [],
            config: {
              mode: canvasConfig.mode,
              width: canvasConfig.width,
              height: canvasConfig.height,
              theme: canvasConfig.theme as any,
            },
          });
          try {
            store.temporal.getState().clear?.();
          } catch {}
        }
      } catch (e) {
        console.error('[Editor] Bootstrap error:', e);
      } finally {
        if (!cancelled) {
          bootstrappingRef.current = false;
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, storage.isCloud]);

  // Embed mode host init payload handler
  useEffect(() => {
    if (!embedVisibility.isEmbedded) return;

    const unsubscribe = onEmbedEvent<EmbedInitPayload>('init', async (payload) => {
      const processed = processEmbedInitPayload(payload);
      if (!processed) {
        console.warn('[Editor] ⚠️ embed init 数据无效');
        return;
      }

      let nodesToLoad = processed.nodes;
      let loadedMeta: any = null;
      let loadedCanvas: any = null;
      const mergedDataSources = [...processed.dataSources] as Array<Record<string, any>>;

      if (processed.platformFieldScope) {
        platformFieldStore.setScope(processed.platformFieldScope as any);
      }
      if (Array.isArray(processed.platformFields) && processed.platformFields.length > 0) {
        platformFieldStore.setFields(processed.platformFields as any);
      }
      const _deviceArr = Array.isArray(processed.platformDevices) ? processed.platformDevices : [];
      if (_deviceArr.length > 0) {
        platformDeviceStore.setDevices(processed.platformDevices as any);
      } else {
        platformDeviceStore.clearDevices();
      }

      if (!mergedDataSources.some((ds) => ds.id === '__platform__')) {
        mergedDataSources.push({
          id: '__platform__',
          name: 'System Platform',
          type: 'PLATFORM_FIELD',
          config: {
            ...DEFAULT_PLATFORM_FIELD_CONFIG,
            source: 'platform',
            requestedFields: (processed.platformFields || [])
              .map((field: any) => field?.id)
              .filter((id: unknown) => typeof id === 'string'),
          },
        });
      }

      (processed.platformDevices || []).forEach((device: any) => {
        if (!device?.deviceId) return;
        const dsId = `__platform_${device.deviceId}__`;
        if (mergedDataSources.some((ds) => ds.id === dsId)) return;
        mergedDataSources.push({
          id: dsId,
          name: device.deviceName || `Device ${device.deviceId}`,
          type: 'PLATFORM_FIELD',
          config: {
            ...DEFAULT_PLATFORM_FIELD_CONFIG,
            source: 'platform',
            deviceId: device.deviceId,
            requestedFields: [],
          },
        });
      });

      if (processed.saveTarget === 'self' && processed.projectId) {
        try {
          const cloudAdapter = createCloudStorageAdapter();
          const cloudProject = await cloudAdapter.get(processed.projectId);
          if (cloudProject) {
            if (cloudProject.schema.nodes.length > 0) {
              nodesToLoad = cloudProject.schema.nodes;
            }
            loadedMeta = cloudProject.meta;
            loadedCanvas = (cloudProject as any).canvas || cloudProject.schema?.canvas;
            if (Array.isArray(cloudProject.schema?.dataSources)) {
              cloudProject.schema.dataSources.forEach((ds: any) => {
                if (!mergedDataSources.some((item) => item.id === ds.id)) {
                  mergedDataSources.push(ds);
                }
              });
            }
          }
        } catch (err) {
          console.warn('[Editor] ⚠️ 获取云端数据失败，使用宿主传来的数据:', err);
        }
      }

      const resolvedCanvas = processed.hasExplicitCanvas
        ? { ...(loadedCanvas || {}), ...processed.canvas }
        : (loadedCanvas ?? processed.canvas);
      const resolvedCanvasMode = normalizeCanvasMode(resolvedCanvas?.mode);

      // Restore background — may be a PageBackground object or a CSS string.
      const rawBg = loadedCanvas?.background ?? processed.canvas.background;
      const bgObj =
        typeof rawBg === 'object' && rawBg !== null
          ? (rawBg as Record<string, unknown>)
          : undefined;
      const bgStr = typeof rawBg === 'string' ? rawBg : undefined;

      setCanvasConfig((prev) => ({
        ...prev,
        id: processed.projectId,
        name: loadedMeta?.name || processed.projectName,
        mode: resolvedCanvasMode,
        width: resolvedCanvas?.width || 1920,
        height: resolvedCanvas?.height || 1080,
        theme: validateCanvasTheme((resolvedCanvas as any)?.theme ?? DEFAULT_CANVAS_THEME),
        bgValue: bgStr ?? prev.bgValue,
        background: (bgObj as CanvasBackground | undefined) ?? prev.background,
        gridCols: resolvedCanvas?.gridCols || processed.canvas.gridCols,
        gridRowHeight: resolvedCanvas?.gridRowHeight || processed.canvas.gridRowHeight,
        gridGap: resolvedCanvas?.gridGap || processed.canvas.gridGap,
        thumbnail: loadedMeta?.thumbnail || processed.thumbnail || '',
        dataSources: mergedDataSources as any,
      }));

      // Immediately push background to store — avoids relying on useEditorSync timing.
      if (bgObj) {
        store.getState().updatePageConfig({
          background: bgObj as unknown as NonNullable<IPageConfig['background']>,
        });
      }

      if (nodesToLoad.length > 0) {
        setBootstrapSummary(createBootstrapSummary(nodesToLoad));
        store.getState().loadPage({
          id: processed.projectId,
          type: 'page' as const,
          version: '1.0.0',
          nodes: nodesToLoad,
          config: {
            mode: resolvedCanvasMode,
            width: resolvedCanvas?.width || 1920,
            height: resolvedCanvas?.height || 1080,
            theme: validateCanvasTheme((resolvedCanvas as any)?.theme ?? DEFAULT_CANVAS_THEME),
            gridSettings: {
              cols: resolvedCanvas?.gridCols ?? 24,
              rowHeight: resolvedCanvas?.gridRowHeight ?? 50,
              gap: resolvedCanvas?.gridGap ?? 10,
              compactVertical: false,
              responsive: false,
              minW: 1,
              minH: 1,
              showGridLines: true,
              breakpoints: [],
            },
          },
        });

        try {
          store.temporal.getState().clear?.();
        } catch {}
      } else {
        setBootstrapSummary({
          ...EMPTY_BOOTSTRAP_SUMMARY,
          projectLoaded: true,
        });
      }

      if (mergedDataSources.length > 0) {
        for (const ds of mergedDataSources) {
          try {
            await dataSourceManager.registerDataSource(ds as any, false);
          } catch (e) {
            console.warn(`[Editor] Failed to restore data source ${ds.id}:`, e);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handshake after bootstrap
  useEffect(() => {
    if (!embedVisibility.isEmbedded) return;
    if (bootstrappingRef.current) return;
    if (isBootstrapping) return;
    messageRouter.send(MSG_TYPES.READY);
    setTimeout(() => {
      messageRouter.send(MSG_TYPES.REQUEST_INIT);
    }, 100);
  }, [isBootstrapping]);

  return {
    canvasConfig,
    setCanvasConfig,
    projectId,
    getProjectState,
    isBootstrapping,
    bootstrapSummary,
    bootstrappingRef,
    canvasInitializedRef,
  };
}
