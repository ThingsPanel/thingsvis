import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageSchemaType, IPage } from '@thingsvis/schema';
import { validateCanvasTheme, DEFAULT_CANVAS_THEME } from '@thingsvis/schema';
import { PreviewCanvas, GridCanvas } from '@thingsvis/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScaleScreen } from '../components/ScaleScreen';

export type PreviewScaleMode = 'fit-min' | 'fit-width' | 'fit-height' | 'stretch' | 'original';
export type PreviewAlignY = 'top' | 'center';

import { actionRuntime, store } from '../lib/store';
import { loadWidget } from '../lib/registry/componentLoader';
import { projectStorage } from '../lib/storage/projectStorage';
import * as previewSession from '../lib/storage/previewSession';
import * as dashboardsApi from '../lib/api/dashboards';
import { buildHashRoute } from '../lib/embed/navigation';

function getPreviewParamsFromHash(): { projectId: string | null } {
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) return { projectId: null };

  const query = hash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  return { projectId: params.get('projectId') };
}

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

function normalizePreviewAlignY(value: unknown): PreviewAlignY {
  return value === 'top' ? 'top' : 'center';
}

export default function PreviewPage() {
  const [{ projectId }, setParams] = useState(() => getPreviewParamsFromHash());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(previewSession.isFullscreen());
  const [scaleMode, setScaleMode] = useState<PreviewScaleMode>('fit-min');
  const [previewAlignY, setPreviewAlignY] = useState<PreviewAlignY>('center');
  const { t } = useTranslation();

  // Observe kernel state so we can decide whether to auto-load from storage.
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), []),
    () => store.getState(),
    () => store.getState(),
  );

  const hasAnyNodes = useMemo(() => {
    const nodesById = kernelState?.nodesById as Record<string, unknown> | undefined;
    return nodesById ? Object.keys(nodesById).length > 0 : false;
  }, [kernelState]);

  const canvasWidth = kernelState?.canvas?.width ?? 1920;
  const canvasHeight = kernelState?.canvas?.height ?? 1080;
  const canvasMode = kernelState?.canvas?.mode ?? 'infinite';

  const pageTheme = useMemo(() => {
    const page = kernelState?.page;
    const config = page && 'config' in page ? page.config : undefined;
    return validateCanvasTheme((config as Record<string, unknown> | undefined)?.theme);
  }, [kernelState]);

  const pageBackground = useMemo(() => {
    const page = kernelState?.page as IPage | undefined;
    return page?.config?.background || { color: 'transparent' };
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
      target.style.backgroundColor = (pageBackground as any)?.color || 'transparent';
      target.style.backgroundImage = (pageBackground as any)?.image
        ? `url(${(pageBackground as any).image})`
        : 'none';
      target.style.backgroundSize = (pageBackground as any)?.size || 'cover';
      target.style.backgroundRepeat = (pageBackground as any)?.repeat || 'no-repeat';
      target.style.backgroundAttachment = (pageBackground as any)?.attachment || 'scroll';
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

  useEffect(() => {
    const onHashChange = () => setParams(getPreviewParamsFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(previewSession.isFullscreen());
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type);
    return entry;
  }, []);

  const applyProjectToStore = useCallback(async () => {
    if (!projectId) {
      setError('Missing projectId');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let project = await projectStorage.load(projectId);

      // If not in local storage, try loading from API (Cloud)
      if (!project) {
        try {
          const response = await dashboardsApi.getDashboard(projectId);
          if (response.data) {
            const dashboard = response.data;
            project = {
              meta: {
                id: dashboard.id,
                name: dashboard.name,
                version: '1.0.0',
                createdAt: new Date(dashboard.createdAt).getTime(),
                updatedAt: new Date(dashboard.updatedAt).getTime(),
              },
              canvas: dashboard.canvasConfig as any,
              nodes: (dashboard.nodes as any[]) || [],
              dataSources: (dashboard.dataSources as any[]) || [],
              variables: (dashboard.variables as any[]) || [],
            };
          }
        } catch (apiErr) {
          console.warn('Failed to load from cloud:', apiErr);
        }
      }

      if (!project) {
        setError('Project not found');
        return;
      }

      const canvasMode = inferCanvasMode(project.canvas, project.nodes || []);

      // Auto-fallback for nodes lacking grid props in grid mode
      const isGrid = canvasMode === 'grid';
      if (isGrid && project.nodes) {
        const GRID_COLS = project.canvas?.gridCols ?? 24;
        let runningY = 0;
        let runningX = 0;
        let maxHeightInRow = 0;

        project.nodes.forEach((node: any) => {
          if (!node.grid) {
            const w = 6;
            const h = 4;
            if (runningX + w > GRID_COLS) {
              runningX = 0;
              runningY += maxHeightInRow || h;
              maxHeightInRow = 0;
            }
            node.grid = { x: runningX, y: runningY, w: w, h: h, static: false };
            runningX += w;
            maxHeightInRow = Math.max(maxHeightInRow, h);
          }
        });
      }

      const page: PageSchemaType = {
        id: project.meta?.id || projectId,
        type: 'page',
        version: project.meta?.version || '1.0.0',
        nodes: project.nodes || [],
      };

      // Normalize background: persisted format is object {color,image,...}, legacy format is string.
      const rawBg = (project.canvas as any)?.background;
      const normalizedBg =
        rawBg !== null && typeof rawBg === 'object'
          ? (rawBg as Record<string, string>)
          : { color: typeof rawBg === 'string' && rawBg ? rawBg : 'transparent' };
      (page as any).config = {
        background: normalizedBg,
        theme: (project.canvas as any)?.theme ?? DEFAULT_CANVAS_THEME,
        scaleMode: (project.canvas as any)?.scaleMode,
        previewAlignY: normalizePreviewAlignY((project.canvas as any)?.previewAlignY),
      };

      store.getState().loadPage(page);

      if (project.canvas) {
        if ((project.canvas as any).scaleMode) {
          setScaleMode((project.canvas as any).scaleMode as PreviewScaleMode);
        }
        setPreviewAlignY(normalizePreviewAlignY((project.canvas as any).previewAlignY));
        store.getState().updateCanvas({
          mode: canvasMode,
          width: project.canvas.width || 1920,
          height: project.canvas.height || 1080,
        });
        if (canvasMode === 'grid') {
          store.getState().setGridSettings?.({
            cols: project.canvas.gridCols ?? 24,
            rowHeight: project.canvas.gridRowHeight ?? 50,
            gap: project.canvas.gridGap ?? 5,
          });
        }
      }

      const variables = (project as any).variables || [];
      if (Array.isArray(variables)) {
        store.getState().setVariableDefinitions(variables as any);
        store.getState().initVariablesFromDefinitions(variables as any);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // If user navigates directly into preview (no editor state), auto-load once.
  useEffect(() => {
    if (!projectId) return;
    if (hasAnyNodes) return;
    void applyProjectToStore();
  }, [projectId, hasAnyNodes, applyProjectToStore]);

  const handleBack = useCallback(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.focus?.();
        window.close();
        return;
      }
    } catch {}

    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const isEmbedded = params.get('mode') === 'embedded';
    // projectId is already in state (projectId const)

    if (!isEmbedded && window.history.length > 1) {
      window.history.back();
      return;
    }

    if (projectId) {
      if (isEmbedded) {
        window.location.hash = buildHashRoute(`#/editor/${projectId}`, {
          preserveCurrentParams: true,
          params: { projectId: null, resumeSession: '1' },
        });
      } else {
        window.location.hash = `#/editor/${projectId}`;
      }
    } else {
      window.location.hash = '#/';
    }
  }, [projectId]);

  const handleRefresh = useCallback(() => {
    void applyProjectToStore();
  }, [applyProjectToStore]);

  const handleToggleFullscreen = useCallback(() => {
    void previewSession.toggleFullscreen(document.documentElement);
  }, []);

  // Show toolbar only while the mouse is moving; hide after 2 s of inactivity.
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const onMouseMove = () => {
      setIsToolbarVisible(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsToolbarVisible(false), 2000);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div
      className={`theme-${pageTheme} relative w-full h-screen`}
      style={{
        backgroundColor: (pageBackground as any)?.color || 'hsl(var(--background))',
        backgroundImage: (pageBackground as any)?.image
          ? `url(${(pageBackground as any).image})`
          : undefined,
        backgroundSize: (pageBackground as any)?.size || 'cover',
        backgroundRepeat: (pageBackground as any)?.repeat || 'no-repeat',
        overflow: canvasMode === 'grid' ? 'auto' : 'hidden',
      }}
    >
      {/* Minimal overlay toolbar — visible only while mouse is moving */}
      <div
        className="absolute top-4 right-4 z-50 pointer-events-auto transition-opacity duration-300"
        style={{
          opacity: isToolbarVisible ? 1 : 0,
          pointerEvents: isToolbarVisible ? 'auto' : 'none',
        }}
      >
        <div className="glass rounded-md shadow-md border border-border flex items-center gap-1 p-1 text-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md focus:ring-0 focus:outline-none"
            onClick={handleBack}
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md focus:ring-0 focus:outline-none"
            onClick={handleRefresh}
            disabled={!projectId || isLoading}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md focus:ring-0 focus:outline-none"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <div className="w-px h-4 mx-2 bg-neutral-300 dark:bg-neutral-600" />

          {canvasMode === 'grid' ? (
            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground select-none">
              {t('preview.scaleMode.responsive', { ns: 'pages' })}
            </span>
          ) : (
            <Select
              value={scaleMode}
              onValueChange={(v: string) => setScaleMode(v as PreviewScaleMode)}
            >
              <SelectTrigger className="w-auto min-w-[140px] px-2 h-8 bg-transparent border-0 ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectItem value="fit-min">
                  {t('preview.scaleMode.fitMin', { ns: 'pages' })}
                </SelectItem>
                <SelectItem value="fit-width">
                  {t('preview.scaleMode.fitWidth', { ns: 'pages' })}
                </SelectItem>
                <SelectItem value="fit-height">
                  {t('preview.scaleMode.fitHeight', { ns: 'pages' })}
                </SelectItem>
                <SelectItem value="stretch">
                  {t('preview.scaleMode.stretch', { ns: 'pages' })}
                </SelectItem>
                <SelectItem value="original">
                  {t('preview.scaleMode.original', { ns: 'pages' })}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Errors / loading */}
      {error ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="glass rounded-md shadow-md border border-border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        </div>
      ) : null}

      {/*
        Grid mode: use GridCanvas (responsive, flow layout, ResizeObserver-driven).
        Other modes: ScaleScreen + PreviewCanvas (fixed-artboard, VisualEngine-rendered).
      */}
      <ErrorBoundary>
        {canvasMode === 'grid' ? (
          <div style={{ width: '100%', minHeight: '100%', padding: 16, boxSizing: 'border-box' }}>
            <GridCanvas
              store={store as any}
              resolveWidget={resolveWidget as any}
              interactive={false}
              fullWidth={true}
              showGridLines={false}
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
