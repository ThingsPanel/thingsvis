/**
 * Embed Page
 *
 * Lightweight preview page designed for iframe embedding.
 * Supports multiple data passing methods:
 * 1. URL query param: ?id=dashboardId (requires API)
 * 2. URL query param: ?token=jwt (for authenticated access)
 * 3. postMessage: { type: 'LOAD_DASHBOARD', payload: schema }
 * 4. postMessage: { type: 'UPDATE_VARIABLES', payload: { key: value } }
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PreviewCanvas, GridCanvas } from '@thingsvis/ui';
import type { KernelState } from '@thingsvis/kernel';
import type { PageSchemaType, DataSource } from '@thingsvis/schema';
import { DEFAULT_CANVAS_THEME } from '@thingsvis/schema';
import { getDashboard } from '@/lib/api/dashboards';
import { apiClient } from '@/lib/api/client';
import { actionRuntime, dataSourceManager, store } from '@/lib/store';
import { loadWidget } from '@/lib/registry/componentLoader';
import { platformFieldStore } from '@/lib/stores/platformFieldStore';
import { platformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { messageRouter, MSG_TYPES } from '@/embed/message-router';
import {
  applyPlatformBufferSize,
  getResolvedPlatformBufferSize,
} from '@/embed/platformDeviceCompat';
import {
  buildPlatformReplayPayloads,
  cachePlatformData,
  type PlatformDataSnapshot,
} from '@/embed/platformDataSnapshot';
import {
  buildEmbedRuntimeVariableValues,
  mergeEmbedRuntimeVariableDefinitions,
  resolveEmbedRuntimeVariableValues,
  resolveThingsVisApiBaseUrl,
} from '@/embed/runtimeVariables';
import { augmentPlatformDataSourcesForNodes } from '@/lib/platformDatasourceBindings';
import { buildEmbeddedProviderDataSources } from '@/lib/embedded/embedded-data-source-registry';
import { sanitizeDataSourcesForHostSave } from '@/lib/embedded/hostDataSourcePolicy';
import { ScaleScreen } from '@/components/ScaleScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingScreen from '@/components/LoadingScreen';
import type { PreviewAlignY, PreviewScaleMode } from './PreviewPage';

/** Padding applied around the grid canvas in embed mode (px). */
const GRID_CANVAS_PADDING = 0;

interface EmbedState {
  isLoading: boolean;
  error: string | null;
  schema: unknown;
  variables: Record<string, unknown>;
}

function buildRuntimeConfigFromSearchParams(searchParams: URLSearchParams) {
  const config: Record<string, unknown> = {};
  ['platformApiBaseUrl', 'thingsvisApiBaseUrl', 'deviceId'].forEach((key) => {
    const value = searchParams.get(key);
    if (value) config[key] = value;
  });

  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  if (startTime || endTime) {
    config.dateRange = { startTime: startTime ?? '', endTime: endTime ?? '' };
  }

  return config;
}

function applyEmbedRuntimeVariables(
  definitions: unknown[] | undefined,
  runtimeValues: Record<string, unknown>,
) {
  const effectiveRuntimeValues = resolveEmbedRuntimeVariableValues(definitions, runtimeValues);
  const mergedDefinitions = mergeEmbedRuntimeVariableDefinitions(
    definitions,
    effectiveRuntimeValues,
  );
  store.getState().setVariableDefinitions(mergedDefinitions as any);
  store.getState().initVariablesFromDefinitions(mergedDefinitions as any);
  Object.entries(effectiveRuntimeValues).forEach(([name, value]) => {
    if (value !== undefined) {
      store.getState().setVariableValue(name, value);
    }
  });
  return mergedDefinitions;
}

function normalizeEmbeddedProviderDataSources(
  dataSources: unknown[],
  provider: string | null,
  context: string | null,
  runtimeVariableValues: Record<string, unknown>,
): unknown[] {
  const groups =
    context === 'dashboard'
      ? (['dashboard'] as const)
      : context === 'device-template'
        ? (['current-device', 'current-device-history'] as const)
        : undefined;
  const providerDefaults = buildEmbeddedProviderDataSources(
    provider,
    runtimeVariableValues,
    groups ? { groups: [...groups] } : undefined,
  );
  if (providerDefaults.length === 0) return dataSources;

  const defaultsById = new Map(providerDefaults.map((source) => [source.id, source]));
  const normalized = dataSources.map((dataSource) => {
    const sourceId =
      dataSource && typeof dataSource === 'object' && typeof (dataSource as any).id === 'string'
        ? (dataSource as any).id
        : '';
    const definition = defaultsById.get(sourceId);
    if (!definition) return dataSource;

    return {
      ...definition,
      name:
        typeof (dataSource as any)?.name === 'string' && (dataSource as any).name
          ? (dataSource as any).name
          : definition.id,
    };
  });

  if (context === 'dashboard') {
    providerDefaults.forEach((definition) => {
      if (normalized.some((dataSource: any) => dataSource?.id === definition.id)) return;
      normalized.push(definition);
    });
  }

  return normalized;
}

// Message types for postMessage communication
type EmbedMessage =
  | { type: 'LOAD_DASHBOARD'; payload: any }
  | { type: 'UPDATE_VARIABLES'; payload: Record<string, any> }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'READY' }
  | { type: 'ERROR'; payload: string }
  | { type: 'LOADED'; payload: { id?: string; name?: string } }
  | { type: 'tv:init'; payload: any }
  | { type: 'tv:event'; payload: any; event?: string };

function inferCanvasMode(canvas: any, nodes: any[] = []): 'fixed' | 'infinite' | 'grid' {
  if (canvas?.mode === 'fixed' || canvas?.mode === 'infinite' || canvas?.mode === 'grid') {
    return canvas.mode;
  }

  if (canvas?.mode === 'reflow') {
    return 'infinite';
  }

  if (typeof canvas?.gridCols === 'number' || typeof canvas?.gridRowHeight === 'number') {
    return 'grid';
  }

  if (
    Array.isArray(nodes) &&
    nodes.some((node) => {
      const grid = node?.grid;
      return (
        grid &&
        typeof grid.x === 'number' &&
        typeof grid.y === 'number' &&
        typeof grid.w === 'number' &&
        typeof grid.h === 'number'
      );
    })
  ) {
    return 'grid';
  }

  return 'infinite';
}

function normalizeCanvasBackground(background: unknown): Record<string, string> {
  return background !== null && typeof background === 'object'
    ? (background as Record<string, string>)
    : { color: typeof background === 'string' && background ? background : 'transparent' };
}

function normalizePreviewAlignY(value: unknown): PreviewAlignY {
  return value === 'top' ? 'top' : 'center';
}

function normalizePreviewScaleMode(value: unknown): PreviewScaleMode {
  return value === 'fit-min' ||
    value === 'fit-width' ||
    value === 'fit-height' ||
    value === 'stretch' ||
    value === 'original'
    ? value
    : 'fit-min';
}

export default function EmbedPage() {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmbedState>({
    isLoading: true,
    error: null,
    schema: null,
    variables: {},
  });
  const cleanupRef = useRef<Array<() => void>>([]);
  const embedTokenRef = useRef<string | null>(searchParams.get('token'));
  /** Whether data sources from the last tv:init have been registered and are ready. */
  const initDoneRef = useRef<boolean>(false);
  /** Fingerprint for the last processed tv:init payload to suppress duplicate host retries. */
  const lastInitFingerprintRef = useRef<string>('');
  /** Buffer for tv:platform-data messages that arrive before adapters are ready. */
  const pendingPlatformDataRef = useRef<
    Array<{ fieldId: string; value: unknown; timestamp: number; deviceId?: string }>
  >([]);
  /** Latest platform field snapshot, retained across repeated tv:init re-registration. */
  const latestPlatformDataRef = useRef<PlatformDataSnapshot>({});

  // Add declaration for debug globals
  if (typeof window !== 'undefined') {
    (window as any)._lastDsUpdate = 0;
    (window as any)._loggedNodes = false;
  }

  // Observe kernel state
  const kernelState = useSyncExternalStore(store.subscribe, store.getState as () => KernelState);

  const canvasMode = kernelState?.canvas?.mode ?? 'infinite';
  const canvasWidth = kernelState?.canvas?.width ?? 1920;
  const canvasHeight = kernelState?.canvas?.height ?? 1080;

  const isGridLayout = canvasMode === 'grid';
  const isHostManagedEmbed =
    searchParams.get('mode') === 'embedded' && searchParams.get('saveTarget') === 'host';
  const shouldKeepLoadingOnError = isHostManagedEmbed && !state.schema;

  const pageBackground = useMemo(() => {
    const page = kernelState?.page as any;
    return (
      (page?.config?.background as Record<string, string> | undefined) || { color: 'transparent' }
    );
  }, [kernelState]);

  const pageTheme = useMemo(() => {
    const page = kernelState?.page as any;
    return (page?.config?.theme as string) ?? DEFAULT_CANVAS_THEME;
  }, [kernelState]);

  useEffect(() => {
    const targets = [
      document.documentElement,
      document.body,
      document.getElementById('root'),
    ].filter((target): target is HTMLElement => Boolean(target));
    const previous = targets.map((target) => ({
      target,
      backgroundColor: target.style.backgroundColor,
      backgroundImage: target.style.backgroundImage,
      backgroundSize: target.style.backgroundSize,
      backgroundRepeat: target.style.backgroundRepeat,
      backgroundAttachment: target.style.backgroundAttachment,
    }));

    targets.forEach((target) => {
      target.style.backgroundColor = pageBackground.color || 'transparent';
      target.style.backgroundImage = pageBackground.image ? `url(${pageBackground.image})` : 'none';
      target.style.backgroundSize = pageBackground.size || 'cover';
      target.style.backgroundRepeat = pageBackground.repeat || 'no-repeat';
      target.style.backgroundAttachment = pageBackground.attachment || 'scroll';
    });

    return () => {
      previous.forEach(({ target, ...styles }) => {
        target.style.backgroundColor = styles.backgroundColor;
        target.style.backgroundImage = styles.backgroundImage;
        target.style.backgroundSize = styles.backgroundSize;
        target.style.backgroundRepeat = styles.backgroundRepeat;
        target.style.backgroundAttachment = styles.backgroundAttachment;
      });
    };
  }, [pageBackground]);

  const schemaCanvas = useMemo(() => {
    const schema = state.schema as {
      canvas?: { scaleMode?: string; previewAlignY?: string };
      canvasConfig?: { scaleMode?: string; previewAlignY?: string };
    } | null;
    return schema?.canvas ?? schema?.canvasConfig ?? null;
  }, [state.schema]);

  const scaleMode: PreviewScaleMode = normalizePreviewScaleMode(
    (kernelState?.page as any)?.config?.scaleMode ?? schemaCanvas?.scaleMode,
  );
  const previewAlignY: PreviewAlignY = normalizePreviewAlignY(
    (kernelState?.page as any)?.config?.previewAlignY ?? schemaCanvas?.previewAlignY,
  );

  const gridSettings = kernelState?.gridState?.settings ?? {
    cols: 24,
    rowHeight: 50,
    gap: 5,
    compactVertical: true,
    minW: 1,
    minH: 1,
    showGridLines: false,
    breakpoints: [],
    responsive: true,
  };
  const postToParent = useCallback((message: EmbedMessage) => {
    if (window.parent !== window) {
      messageRouter.send(message.type, (message as any).payload);
    }
  }, []);

  const setEmbedApiToken = useCallback((nextToken: string | null) => {
    embedTokenRef.current = nextToken;
    apiClient.configure({
      getToken: () => embedTokenRef.current,
    });
  }, []);

  // Resolve plugin for canvas
  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type);
    return entry;
  }, []);

  // Load dashboard from API by ID with optional share token
  const loadFromApiWithShareToken = useCallback(
    async (id: string, shareToken: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // Import validateShareLink here to avoid circular dependency
        const { validateShareLink } = await import('@/lib/api/dashboards');

        const response = await validateShareLink(id, shareToken);

        if (response.error || !response.data?.valid || !response.data?.dashboard) {
          const errorMsg = response.data?.error || response.error || 'Share link invalid';
          throw new Error(errorMsg);
        }

        const dashboard = response.data.dashboard;

        // Load page into kernel
        const page: PageSchemaType = {
          id: dashboard.id,
          type: 'page',
          version: '1.0.0',
          nodes: (dashboard.nodes as any[]) || [],
        };
        (page as any).config = {
          background: normalizeCanvasBackground((dashboard.canvasConfig as any)?.background),
          theme: (dashboard.canvasConfig as any)?.theme ?? DEFAULT_CANVAS_THEME,
          scaleMode: (dashboard.canvasConfig as any)?.scaleMode,
          previewAlignY: normalizePreviewAlignY((dashboard.canvasConfig as any)?.previewAlignY),
        };

        store.getState().loadPage(page);

        if (dashboard.canvasConfig) {
          store.getState().updateCanvas({
            mode:
              (dashboard.canvasConfig.mode as any) ||
              (dashboard.canvasConfig.gridEnabled ? 'grid' : 'infinite'),
            width: dashboard.canvasConfig.width || 1920,
            height: dashboard.canvasConfig.height || 1080,
          });
        }

        const variables = Array.isArray(dashboard.variables) ? (dashboard.variables as any[]) : [];
        const runtimeVariableValues = buildEmbedRuntimeVariableValues(
          buildRuntimeConfigFromSearchParams(searchParams),
        );
        applyEmbedRuntimeVariables(variables, runtimeVariableValues);

        setState({
          isLoading: false,
          error: null,
          schema: dashboard as unknown,
          variables: {},
        });

        // Register dashboard data sources
        const dataSources = normalizeEmbeddedProviderDataSources(
          (dashboard.dataSources as any[]) || [],
          searchParams.get('provider'),
          searchParams.get('context'),
          runtimeVariableValues,
        );
        if (dataSources.length > 0) {
          dataSources.forEach((ds: any) => {
            dataSourceManager.registerDataSource(ds, false).catch((err: any) => {
              console.error('[EmbedPage] Failed to register data source:', ds.id, err);
            });
          });
        }

        postToParent({ type: 'LOADED', payload: { id: dashboard.id, name: dashboard.name } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
        setState((s) => ({ ...s, isLoading: false, error: errorMessage }));
        postToParent({ type: 'ERROR', payload: errorMessage });
      }
    },
    [postToParent, searchParams],
  );

  // Load dashboard from API by ID
  const loadFromApi = useCallback(
    async (id: string, token?: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        if (token) {
          setEmbedApiToken(token);
        }

        const response = await getDashboard(id);

        if (response.error || !response.data) {
          throw new Error(response.error || 'Dashboard not found');
        }

        const dashboard = response.data;

        // Load page into kernel
        const page: PageSchemaType = {
          id: dashboard.id,
          type: 'page',
          version: '1.0.0',
          nodes: (dashboard.nodes as any[]) || [],
        };
        (page as any).config = {
          background: normalizeCanvasBackground((dashboard.canvasConfig as any)?.background),
          theme: (dashboard.canvasConfig as any)?.theme ?? DEFAULT_CANVAS_THEME,
          scaleMode: (dashboard.canvasConfig as any)?.scaleMode,
          previewAlignY: normalizePreviewAlignY((dashboard.canvasConfig as any)?.previewAlignY),
        };

        store.getState().loadPage(page);

        if (dashboard.canvasConfig) {
          store.getState().updateCanvas({
            mode:
              (dashboard.canvasConfig.mode as any) ||
              (dashboard.canvasConfig.gridEnabled ? 'grid' : 'infinite'),
            width: dashboard.canvasConfig.width || 1920,
            height: dashboard.canvasConfig.height || 1080,
          });
        }

        const variables = Array.isArray(dashboard.variables) ? (dashboard.variables as any[]) : [];
        const runtimeVariableValues = buildEmbedRuntimeVariableValues(
          buildRuntimeConfigFromSearchParams(searchParams),
        );
        applyEmbedRuntimeVariables(variables, runtimeVariableValues);

        setState({
          isLoading: false,
          error: null,
          schema: dashboard as unknown,
          variables: {},
        });

        // Register dashboard data sources so adapters (e.g. PLATFORM_FIELD) activate.
        // The INIT handler covers the postMessage-schema path; this covers the API-load path.
        const dataSources = normalizeEmbeddedProviderDataSources(
          (dashboard.dataSources as any[]) || [],
          searchParams.get('provider'),
          searchParams.get('context'),
          runtimeVariableValues,
        );
        if (dataSources.length > 0) {
          dataSources.forEach((ds: any) => {
            dataSourceManager.registerDataSource(ds, false).catch((err: any) => {
              console.error('[EmbedPage] Failed to register data source:', ds.id, err);
            });
          });
        }

        postToParent({ type: 'LOADED', payload: { id: dashboard.id, name: dashboard.name } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
        setState((s) => ({ ...s, isLoading: false, error: errorMessage }));
        postToParent({ type: 'ERROR', payload: errorMessage });
      }
    },
    [postToParent, searchParams, setEmbedApiToken],
  );

  // Load dashboard from schema data
  const loadFromSchema = useCallback(
    (schema: any, options?: { skipVariableInitialization?: boolean }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      if (!schema || !schema.canvas) {
        console.error('❌ [EmbedPage] Invalid schema:', schema);
        setState((s) => ({ ...s, isLoading: false, error: 'Invalid schema provided' }));
        postToParent({ type: 'ERROR', payload: 'Invalid schema provided' });
        return;
      }

      try {
        // Load page into kernel FIRST (this resets canvas to defaults)
        const pageNodes = Array.isArray(schema.nodes)
          ? schema.nodes.map((node: any) => ({
              ...node,
              ...(node?.grid ? { grid: { ...node.grid } } : {}),
            }))
          : [];
        const canvasMode = inferCanvasMode(schema.canvas, pageNodes);

        // This fixes the issue where nodes without grid props stack on top of each other
        const isGrid = canvasMode === 'grid';
        if (isGrid) {
          const GRID_COLS = schema.canvas.gridCols ?? 24;
          let runningY = 0;
          let runningX = 0;
          let maxHeightInRow = 0;

          pageNodes.forEach((node: any) => {
            if (!node.grid) {
              console.warn(
                `⚠️ [EmbedPage] Node ${node.id} missing grid props! Generating fallback...`,
              );
              // Calculate a default grid position if missing
              // Default width: 6 columns (1/4 of simplified 24-col grid)
              const w = 6;
              // Default height: 4 rows (~200px)
              const h = 4;

              // Check if we need to wrap to next row
              if (runningX + w > GRID_COLS) {
                runningX = 0;
                runningY += maxHeightInRow || h;
                maxHeightInRow = 0;
              }

              node.grid = {
                x: runningX,
                y: runningY,
                w: w,
                h: h,
              };

              // Update placement for next node
              runningX += w;
              maxHeightInRow = Math.max(maxHeightInRow, h);
            } else {
              /* empty */
            }
          });
        }

        const page: PageSchemaType = {
          id: schema.id || 'embed-page',
          type: 'page',
          version: '1.0.0',
          nodes: pageNodes,
        };
        (page as any).config = {
          background: normalizeCanvasBackground(schema.canvas?.background),
          theme: (schema.canvas as any)?.theme ?? DEFAULT_CANVAS_THEME,
          scaleMode: (schema.canvas as any)?.scaleMode,
          previewAlignY: normalizePreviewAlignY((schema.canvas as any)?.previewAlignY),
        };

        store.getState().loadPage(page);

        // Update canvas settings AFTER loadPage (loadPage resets canvas to defaults)
        store.getState().updateCanvas({
          mode: canvasMode,
          width: schema.canvas.width || 1920,
          height: schema.canvas.height || 1080,
        });

        // Verify the final canvas state

        // Update grid settings in store if needed
        if (canvasMode === 'grid') {
          const gridSettings = {
            cols: schema.canvas.gridCols ?? 24,
            rowHeight: schema.canvas.gridRowHeight ?? 50,
            gap: schema.canvas.gridGap ?? 5,
          };

          store.getState().setGridSettings?.(gridSettings);
        }

        const variables = (schema.variables as any[]) || [];
        if (!options?.skipVariableInitialization && Array.isArray(variables)) {
          store.getState().setVariableDefinitions(variables as any);
          store.getState().initVariablesFromDefinitions(variables as any);
        }

        setState({
          isLoading: false,
          error: null,
          schema,
          variables: {},
        });

        postToParent({ type: 'LOADED', payload: { name: schema.name } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load schema';
        setState((s) => ({ ...s, isLoading: false, error: errorMessage }));
        postToParent({ type: 'ERROR', payload: errorMessage });
      }
    },
    [postToParent],
  );

  // Update variables
  const updateVariables = useCallback((variables: Record<string, any>) => {
    setState((s) => ({
      ...s,
      variables: { ...s.variables, ...variables },
    }));

    // TODO: Dispatch variable update to kernel when variable system is implemented
  }, []);

  // Phase 3: Handle messages from parent via messageRouter
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // LOAD_DASHBOARD
    cleanups.push(
      messageRouter.on(MSG_TYPES.LOAD_DASHBOARD, (payload: any) => {
        loadFromSchema(payload);
      }),
    );

    // UPDATE_VARIABLES
    cleanups.push(
      messageRouter.on(MSG_TYPES.UPDATE_VARIABLES, (payload: any) => {
        updateVariables(payload);
      }),
    );

    // SET_TOKEN
    cleanups.push(
      messageRouter.on(MSG_TYPES.SET_TOKEN, (payload: any) => {
        setEmbedApiToken(typeof payload === 'string' ? payload : null);
      }),
    );

    // thingsvis:editor-init (兼容标准嵌入协议)
    cleanups.push(
      messageRouter.on(MSG_TYPES.INIT, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return;
        const msg = payload as {
          data?: Record<string, unknown>;
          platformDeviceGroups?: Array<Record<string, unknown>>;
          config?: Record<string, unknown>;
          platformDevices?: Array<Record<string, unknown>>;
          platformFields?: Array<Record<string, unknown>>;
          platformBufferSize?: number;
        };
        if (!msg.data) return;
        const initData = msg.data;
        const meta = initData.meta as { id?: string; name?: string } | undefined;
        const nextFingerprint = JSON.stringify({
          dashboardId: meta?.id ?? null,
          dashboardName: meta?.name ?? null,
          nodeCount: Array.isArray(initData.nodes) ? initData.nodes.length : 0,
          dataSourceIds: Array.isArray(initData.dataSources)
            ? initData.dataSources.map((ds: any) => ds?.id ?? null)
            : [],
          variableCount: Array.isArray(initData.variables) ? initData.variables.length : 0,
          canvas: initData.canvas ?? null,
          platformDeviceGroupIds: Array.isArray(msg.platformDeviceGroups)
            ? msg.platformDeviceGroups.map((group: any) => group?.groupId ?? group?.id ?? null)
            : [],
          platformDeviceIds: Array.isArray(msg.platformDevices)
            ? msg.platformDevices.map((device: any) => device?.deviceId ?? device?.id ?? null)
            : [],
          platformFieldIds: Array.isArray(msg.platformFields)
            ? msg.platformFields.map((field: any) => field?.id ?? null)
            : [],
          platformBufferSize: msg.platformBufferSize ?? null,
          config: msg.config ?? null,
        });
        if (nextFingerprint === lastInitFingerprintRef.current) {
          return;
        }
        lastInitFingerprintRef.current = nextFingerprint;
        const thingsvisApiBaseUrl = resolveThingsVisApiBaseUrl(msg.config);
        if (thingsvisApiBaseUrl) {
          apiClient.configure({ baseUrl: thingsvisApiBaseUrl });
        }
        {
          const schema: {
            id?: string;
            name?: string;
            canvas: unknown;
            nodes?: unknown[];
            dataSources: unknown[];
            variables: unknown[];
          } = {
            id: meta?.id,
            name: meta?.name,
            canvas: initData.canvas,
            nodes: initData.nodes as unknown[] | undefined,
            dataSources: (initData.dataSources as unknown[] | undefined) ?? [],
            variables: (initData.variables as unknown[] | undefined) ?? [],
          };

          const platformDeviceGroups = Array.isArray(msg.platformDeviceGroups)
            ? msg.platformDeviceGroups
            : [];
          const platformDevices = Array.isArray(msg.platformDevices) ? msg.platformDevices : [];
          const topLevelPlatformFields = Array.isArray(msg.platformFields)
            ? msg.platformFields
            : [];
          const initPlatformFields = Array.isArray(initData.platformFields)
            ? initData.platformFields
            : topLevelPlatformFields;

          if (platformDeviceGroups.length > 0) {
            platformDeviceStore.setGroups(platformDeviceGroups as never);
          }

          const inheritedPlatformBufferSize = getResolvedPlatformBufferSize(
            (schema.dataSources ?? []) as DataSource[],
            msg.platformBufferSize,
          );

          if (platformDevices.length > 0) {
            platformDeviceStore.setDevices(platformDevices as never);
            platformDevices.forEach((device: any) => {
              if (!device?.deviceId) return;
              if (
                !schema.dataSources?.some((ds: any) => ds.id === `__platform_${device.deviceId}__`)
              ) {
                schema.dataSources?.push({
                  id: `__platform_${device.deviceId}__`,
                  name: device.deviceName || `Device ${device.deviceId}`,
                  type: 'PLATFORM_FIELD',
                  config: {
                    source: 'platform',
                    fieldMappings: {},
                    bufferSize: inheritedPlatformBufferSize,
                    deviceId: device.deviceId,
                    // Do not eagerly request every field for every device during editor init.
                    // The field picker already has static field definitions from platformDevices,
                    // and specific preview/runtime requests can ask the host on demand.
                    requestedFields: [],
                  },
                });
              }
            });
          } else if (platformDeviceGroups.length === 0) {
            platformDeviceStore.clearDevices();
          }

          const singleRuntimeDeviceId =
            platformDevices.length === 1 && typeof platformDevices[0]?.deviceId === 'string'
              ? (platformDevices[0].deviceId as string)
              : null;
          const runtimeVariableValues = buildEmbedRuntimeVariableValues(
            msg.config,
            singleRuntimeDeviceId,
          );

          const normalizedDataSources = normalizeEmbeddedProviderDataSources(
            (schema.dataSources ?? []) as DataSource[],
            searchParams.get('provider'),
            searchParams.get('context'),
            runtimeVariableValues,
          ) as DataSource[];

          schema.dataSources = applyPlatformBufferSize(
            normalizedDataSources,
            msg.platformBufferSize,
          );

          schema.dataSources = augmentPlatformDataSourcesForNodes(
            (schema.dataSources ?? []) as DataSource[],
            ((schema.nodes as unknown[]) ?? []) as Array<Record<string, unknown>>,
          );

          if (searchParams.get('context') === 'device-template') {
            schema.dataSources = sanitizeDataSourcesForHostSave(
              ((schema.nodes as unknown[]) ?? []) as Array<Record<string, unknown>>,
              schema.dataSources,
              'device-template',
            ) as DataSource[];
          }

          schema.variables = applyEmbedRuntimeVariables(schema.variables, runtimeVariableValues);

          const schemaVariables = Array.isArray(schema.variables) ? schema.variables : [];
          if (schemaVariables.length > 0) {
            store.getState().setVariableDefinitions(schemaVariables as any);
            store.getState().initVariablesFromDefinitions(schemaVariables as any);
          }

          // Platform Fields
          if (initPlatformFields.length > 0) {
            platformFieldStore.setFields(initPlatformFields as never);
          }

          // Register data sources sequentially and AWAIT before loading schema.
          // This ensures PlatformFieldAdapter.subscribeToHostData() has installed its
          // window.addEventListener before any tv:platform-data messages arrive.
          // Reset init-done flag so that messages arriving during re-init are buffered.
          initDoneRef.current = false;
          pendingPlatformDataRef.current = [];
          const registerAndLoad = async () => {
            if (schema.dataSources && Array.isArray(schema.dataSources)) {
              for (const ds of schema.dataSources as any[]) {
                try {
                  await dataSourceManager.registerDataSource(ds, false);
                } catch (err: any) {
                  console.error('[EmbedPage] Failed to register data source:', ds.id, err);
                }
              }
            }
            loadFromSchema(schema, { skipVariableInitialization: true });

            // Replay any platform-data messages that arrived before adapters were ready.
            if (pendingPlatformDataRef.current.length > 0) {
              const buffered = pendingPlatformDataRef.current.splice(0);
              buffered.forEach(({ fieldId, value, timestamp, deviceId }) => {
                window.postMessage(
                  {
                    type: MSG_TYPES.PLATFORM_DATA,
                    payload: { fieldId, value, timestamp, deviceId },
                  },
                  '*',
                );
              });
            }

            const replayPayloads = buildPlatformReplayPayloads(latestPlatformDataRef.current);
            replayPayloads.forEach(({ fieldId, value, timestamp, deviceId }) => {
              window.postMessage(
                { type: MSG_TYPES.PLATFORM_DATA, payload: { fieldId, value, timestamp, deviceId } },
                '*',
              );
            });
            initDoneRef.current = true;
          };

          registerAndLoad();
        }
      }),
    );

    // tv:platform-data: support bulk format { fields: Record<string, unknown> } from host.
    // Per-field format { fieldId, value } is handled directly by PlatformFieldAdapter.
    // Messages arriving before adapters are ready are buffered and replayed post-init.
    cleanups.push(
      messageRouter.on(MSG_TYPES.PLATFORM_DATA, (payload: any) => {
        if (!payload) return;
        latestPlatformDataRef.current = cachePlatformData(latestPlatformDataRef.current, payload);

        void (async () => {
          // Per-field messages are handled by PlatformFieldAdapter directly.
          if (payload.fieldId !== undefined) {
            return;
          }

          if (payload.fields && typeof payload.fields === 'object') {
            const timestamp = payload.timestamp ?? Date.now();
            Object.entries(payload.fields as Record<string, unknown>).forEach(
              ([fieldId, value]) => {
                if (!initDoneRef.current) {
                  // Adapters not yet ready — buffer for replay after registration completes
                  pendingPlatformDataRef.current.push({
                    fieldId,
                    value,
                    timestamp,
                    deviceId: payload.deviceId,
                  });
                } else {
                  window.postMessage(
                    {
                      type: MSG_TYPES.PLATFORM_DATA,
                      payload: { fieldId, value, timestamp, deviceId: payload.deviceId },
                    },
                    '*',
                  );
                }
              },
            );
          }
        })();
      }),
    );

    // thingsvis:editor-event (updateData / updateSchema)
    cleanups.push(
      messageRouter.on(MSG_TYPES.EDITOR_EVENT, (eventData: any) => {
        if (!eventData) return;
        const eventName = eventData.event;

        if (eventName === 'updateData') {
          const data = eventData.payload || eventData.data;
          updateVariables(data);

          // Bridge to PlatformFieldAdapter
          if (data && typeof data === 'object') {
            Object.entries(data).forEach(([fieldId, value]) => {
              window.postMessage(
                {
                  type: MSG_TYPES.PLATFORM_DATA,
                  payload: { fieldId, value, timestamp: Date.now() },
                },
                '*',
              );
            });
          }
        } else if (eventName === 'updateSchema') {
          const fields = eventData.payload;
          if (Array.isArray(fields)) {
            platformFieldStore.setFields(fields);
          }
        }
      }),
    );

    cleanupRef.current = cleanups;
    return () => cleanups.forEach((fn) => fn());
  }, [loadFromSchema, setEmbedApiToken, updateVariables]);

  // Initial load from URL params
  useEffect(() => {
    const dashboardId = searchParams.get('id');
    const token = searchParams.get('token');
    const shareToken = searchParams.get('shareToken');

    // Priority: shareToken > regular token
    if (dashboardId && shareToken) {
      // Share link mode - no authentication required
      loadFromApiWithShareToken(dashboardId, shareToken);
    } else if (dashboardId && token) {
      // SSO token mode - backward compatible
      setEmbedApiToken(token);
      loadFromApi(dashboardId, token);
    } else if (dashboardId) {
      // Try loading with current token (if any)
      loadFromApi(dashboardId);
    } else {
      // Host-managed embed waits for tv:init via postMessage.
      // Keep the built-in loading state alive so the viewer only shows one
      // continuous ThingsVis loading animation instead of loading -> ready -> loading.
      if (!isHostManagedEmbed) {
        setState((s) => ({ ...s, isLoading: false }));
      }
      postToParent({ type: 'READY' });
    }
  }, [searchParams, loadFromApi, loadFromApiWithShareToken, postToParent, setEmbedApiToken]);

  // Render
  if (state.isLoading || shouldKeepLoadingOnError) {
    return (
      <LoadingScreen
        progress={shouldKeepLoadingOnError ? 28 : 36}
        statusText={shouldKeepLoadingOnError ? '初始化可视化引擎...' : '加载仪表板中...'}
      />
    );
  }

  if (state.error) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-background"
        style={{ minHeight: '100%' }}
      >
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">加载失败</h2>
          <p className="text-muted-foreground text-sm">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.schema) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-background"
        style={{ minHeight: '100%' }}
      >
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">已就绪</h2>
          <p className="text-muted-foreground text-sm">
            使用 postMessage 发送仪表板数据，或在 URL 中提供 ?id= 参数。
          </p>
        </div>
      </div>
    );
  }

  // Auto-calculation of zoom for non-grid layouts (Fixed/Infinite)
  return (
    <div
      className={`theme-${pageTheme} relative overflow-auto thingsvis-embed-surface`}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: pageBackground.color || 'transparent',
        backgroundImage: pageBackground.image ? `url(${pageBackground.image})` : undefined,
        backgroundSize: pageBackground.size || 'cover',
        backgroundRepeat: pageBackground.repeat || 'no-repeat',
      }}
    >
      <ErrorBoundary>
        {isGridLayout ? (
          <div
            style={{
              width: '100%',
              minHeight: '100%',
              padding: GRID_CANVAS_PADDING,
              boxSizing: 'border-box',
            }}
          >
            <GridCanvas
              store={store as any}
              resolveWidget={resolveWidget as any}
              locale={locale}
              settings={{ ...gridSettings, showGridLines: false }}
              interactive={false}
              fullWidth={true}
              actionRuntime={actionRuntime}
            />
          </div>
        ) : (
          <ScaleScreen
            width={canvasWidth}
            height={canvasHeight}
            mode={scaleMode}
            alignY={previewAlignY}
          >
            {(engineZoom) => (
              <PreviewCanvas
                store={store as any}
                resolveWidget={resolveWidget as any}
                locale={locale}
                zoom={engineZoom}
                actionRuntime={actionRuntime}
              />
            )}
          </ScaleScreen>
        )}
      </ErrorBoundary>
    </div>
  );
}
