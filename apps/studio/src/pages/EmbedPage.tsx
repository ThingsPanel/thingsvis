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
import { PreviewCanvas, GridCanvas } from '@thingsvis/ui';
import { dataSourceManager } from '@thingsvis/kernel';
import type { KernelState } from '@thingsvis/kernel';
import type { PageSchemaType, DataSource } from '@thingsvis/schema';
import { DEFAULT_CANVAS_THEME } from '@thingsvis/schema';
import { getDashboard } from '@/lib/api/dashboards';
import { apiClient } from '@/lib/api/client';
import { store } from '@/lib/store';
import { loadWidget } from '@/lib/registry/componentLoader';
import { platformFieldStore } from '@/lib/stores/platformFieldStore';
import { platformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { messageRouter, MSG_TYPES } from '@/embed/message-router';
import {
  applyPlatformBufferSize,
  adoptLegacyPlatformDataSources,
  findLegacyPlatformDataSourceIdsForAdoption,
  hasPlatformDataSourceBoundToDevice,
  getResolvedPlatformBufferSize,
  inferSinglePlatformDeviceId,
} from '@/embed/platformDeviceCompat';
import {
  buildPlatformReplayPayloads,
  cachePlatformData,
  type PlatformDataSnapshot,
} from '@/embed/platformDataSnapshot';
import { augmentPlatformDataSourcesForNodes } from '@/lib/platformDatasourceBindings';
import { ScaleScreen } from '@/components/ScaleScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { PreviewAlignY, PreviewScaleMode } from './PreviewPage';

/** Padding applied around the grid canvas in embed mode (px). */
const GRID_CANVAS_PADDING = 0;

interface EmbedState {
  isLoading: boolean;
  error: string | null;
  schema: unknown;
  variables: Record<string, unknown>;
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

export default function EmbedPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<EmbedState>({
    isLoading: true,
    error: null,
    schema: null,
    variables: {},
  });
  const cleanupRef = useRef<Array<() => void>>([]);
  /** Whether data sources from the last tv:init have been registered and are ready. */
  const initDoneRef = useRef<boolean>(false);
  /** Buffer for tv:platform-data messages that arrive before adapters are ready. */
  const pendingPlatformDataRef = useRef<
    Array<{ fieldId: string; value: unknown; timestamp: number; deviceId?: string }>
  >([]);
  /** Legacy platform datasource ids that should bind to the runtime device in single-device detail pages. */
  const legacyPlatformDataSourceIdsRef = useRef<string[]>([]);
  const adoptedLegacyDeviceIdRef = useRef<string | null>(null);
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

  const pageBackground = useMemo(() => {
    const page = (kernelState?.page as any);
    return (page?.config?.background as Record<string, string> | undefined) || { color: 'transparent' };
  }, [kernelState]);

  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById('root')].filter(
      (target): target is HTMLElement => Boolean(target),
    );
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

  const scaleMode: PreviewScaleMode =
    ((state.schema as { canvas?: { scaleMode?: string } } | null)?.canvas
      ?.scaleMode as PreviewScaleMode) || 'fit-min';
  const previewAlignY: PreviewAlignY = normalizePreviewAlignY(
    (state.schema as { canvas?: { previewAlignY?: string } } | null)?.canvas?.previewAlignY,
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

  // Resolve plugin for canvas
  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type);
    return entry;
  }, []);

  // Load dashboard from API by ID
  const loadFromApi = useCallback(
    async (id: string, token?: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        if (token) {
          localStorage.setItem('thingsvis_token', token);
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

        const variables = (dashboard.variables as any[]) || [];
        if (Array.isArray(variables)) {
          store.getState().setVariableDefinitions(variables as any);
          store.getState().initVariablesFromDefinitions(variables as any);
        }

        setState({
          isLoading: false,
          error: null,
          schema: dashboard as unknown,
          variables: {},
        });

        // Register dashboard data sources so adapters (e.g. PLATFORM_FIELD) activate.
        // The INIT handler covers the postMessage-schema path; this covers the API-load path.
        const dataSources = (dashboard.dataSources as any[]) || [];
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
    [postToParent],
  );

  // Load dashboard from schema data
  const loadFromSchema = useCallback(
    (schema: any) => {
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
        if (Array.isArray(variables)) {
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

  const adoptLegacyPlatformBindings = useCallback(async (deviceId?: string) => {
    if (!deviceId) return false;
    if (adoptedLegacyDeviceIdRef.current === deviceId) return false;

    const legacyIds = legacyPlatformDataSourceIdsRef.current;
    if (legacyIds.length === 0) return false;

    const currentConfigs = dataSourceManager.getAllConfigs();
    if (hasPlatformDataSourceBoundToDevice(currentConfigs, deviceId)) {
      adoptedLegacyDeviceIdRef.current = deviceId;
      legacyPlatformDataSourceIdsRef.current = [];
      return false;
    }

    const adoptedConfigs = adoptLegacyPlatformDataSources(
      currentConfigs.filter((config) => legacyIds.includes(config.id)),
      deviceId,
    );

    if (adoptedConfigs.length === 0) return false;

    await Promise.all(
      adoptedConfigs.map((config) =>
        dataSourceManager.registerDataSource(config, false).catch((error) => {
          console.error(
            '[EmbedPage] Failed to adopt legacy platform datasource:',
            config.id,
            error,
          );
        }),
      ),
    );

    adoptedLegacyDeviceIdRef.current = deviceId;
    legacyPlatformDataSourceIdsRef.current = [];

    console.warn(
      '[EmbedPage] Adopted legacy platform datasource bindings for runtime device:',
      deviceId,
      adoptedConfigs.map((config) => config.id),
    );

    return true;
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
        localStorage.setItem('thingsvis_token', payload);
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
          platformFieldScope?: string;
          roleScope?: string;
        };
        if (!msg.data) return;
        const apiBaseUrl = msg.config?.apiBaseUrl;
        if (typeof apiBaseUrl === 'string' && apiBaseUrl) {
          apiClient.configure({ baseUrl: apiBaseUrl });
        }
        {
          const initData = msg.data;
          const meta = initData.meta as { id?: string; name?: string } | undefined;
          const schema = {
            id: meta?.id,
            name: meta?.name,
            canvas: initData.canvas,
            nodes: initData.nodes as unknown[] | undefined,
            dataSources: (initData.dataSources as unknown[] | undefined) ?? [],
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

          if (typeof msg.platformFieldScope === 'string' || typeof msg.roleScope === 'string') {
            platformFieldStore.setScope(
              (msg.platformFieldScope || msg.roleScope || 'all') as Parameters<
                typeof platformFieldStore.setScope
              >[0],
            );
          }
          if (platformDeviceGroups.length > 0) {
            platformDeviceStore.setGroups(platformDeviceGroups as never);
          }

          const inheritedPlatformBufferSize = getResolvedPlatformBufferSize(
            (schema.dataSources ?? []) as DataSource[],
            msg.platformBufferSize,
          );

          // Auto-inject __platform__ data source only when the host has not already provided one.
          // Preserving the host-supplied entry is critical: it may carry a non-zero bufferSize
          // that enables the rolling history buffer in PlatformFieldAdapter.
          if (!schema.dataSources?.some((ds: any) => ds.id === '__platform__')) {
            if (!schema.dataSources) schema.dataSources = [];
            schema.dataSources.push({
              id: '__platform__',
              name: 'System Platform',
              type: 'PLATFORM_FIELD',
              config: {
                source: 'platform',
                fieldMappings: {},
                requestedFields: initPlatformFields
                  .map((field: any) => field?.id)
                  .filter((id: unknown) => typeof id === 'string'),
                bufferSize: inheritedPlatformBufferSize,
              },
            });
          }

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

          schema.dataSources = applyPlatformBufferSize(
            (schema.dataSources ?? []) as DataSource[],
            msg.platformBufferSize,
          );

          schema.dataSources = augmentPlatformDataSourcesForNodes(
            (schema.dataSources ?? []) as DataSource[],
            ((schema.nodes as unknown[]) ?? []) as Array<Record<string, unknown>>,
          );

          const singleRuntimeDeviceId =
            platformDevices.length === 1 && typeof platformDevices[0]?.deviceId === 'string'
              ? (platformDevices[0].deviceId as string)
              : null;
          const inferredRuntimeDeviceId =
            singleRuntimeDeviceId ??
            inferSinglePlatformDeviceId((schema.dataSources ?? []) as DataSource[]);

          if (inferredRuntimeDeviceId) {
            schema.dataSources = adoptLegacyPlatformDataSources(
              (schema.dataSources ?? []) as DataSource[],
              inferredRuntimeDeviceId,
            );
            adoptedLegacyDeviceIdRef.current = inferredRuntimeDeviceId;
            legacyPlatformDataSourceIdsRef.current = [];
          } else {
            legacyPlatformDataSourceIdsRef.current = findLegacyPlatformDataSourceIdsForAdoption(
              (schema.dataSources ?? []) as DataSource[],
            );
            adoptedLegacyDeviceIdRef.current = null;
          }

          if (legacyPlatformDataSourceIdsRef.current.length > 0) {
            console.warn(
              '[EmbedPage] Legacy platform bindings detected; waiting for runtime deviceId:',
              legacyPlatformDataSourceIdsRef.current,
            );
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
            loadFromSchema(schema);

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
          const adopted =
            payload.__legacyCompatReplay === true
              ? false
              : await adoptLegacyPlatformBindings(payload.deviceId);

          // Per-field messages are handled by PlatformFieldAdapter directly.
          // If a legacy datasource was rebound just now, replay the same message once.
          if (payload.fieldId !== undefined) {
            if (adopted) {
              window.postMessage(
                {
                  type: MSG_TYPES.PLATFORM_DATA,
                  payload: {
                    ...payload,
                    __legacyCompatReplay: true,
                  },
                },
                '*',
              );
            }
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
  }, [adoptLegacyPlatformBindings, loadFromSchema, updateVariables]);

  // Initial load from URL params
  useEffect(() => {
    const dashboardId = searchParams.get('id');
    const token = searchParams.get('token');

    if (dashboardId) {
      loadFromApi(dashboardId, token || undefined);
    } else {
      // No ID provided - waiting for postMessage
      setState((s) => ({ ...s, isLoading: false }));
      postToParent({ type: 'READY' });
    }
  }, [searchParams, loadFromApi, postToParent]);

  // Render
  if (state.isLoading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-background"
        style={{ minHeight: '100%' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">加载仪表板中...</p>
        </div>
      </div>
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
      className="relative overflow-auto thingsvis-embed-surface"
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
              settings={{ ...gridSettings, showGridLines: false }}
              interactive={false}
              fullWidth={true}
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
                zoom={engineZoom}
              />
            )}
          </ScaleScreen>
        )}
      </ErrorBoundary>
    </div>
  );
}
