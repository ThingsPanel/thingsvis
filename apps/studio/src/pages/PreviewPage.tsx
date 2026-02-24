import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Maximize, Minimize, RefreshCw } from 'lucide-react'
import type { PageSchemaType } from '@thingsvis/schema'
import { CanvasView, GridStackCanvas } from '@thingsvis/ui'

import { store } from '../lib/store'
import { loadWidget } from '../widgets/widgetResolver'
import { projectStorage } from '../lib/storage/projectStorage'
import * as previewSession from '../lib/storage/previewSession'
import * as dashboardsApi from '../lib/api/dashboards'
import type { ProjectFile } from '../lib/storage/schemas'

function getPreviewParamsFromHash(): { projectId: string | null } {
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) return { projectId: null }

  const query = hash.slice(queryIndex + 1)
  const params = new URLSearchParams(query)
  return { projectId: params.get('projectId') }
}

export default function PreviewPage() {
  const [{ projectId }, setParams] = useState(() => getPreviewParamsFromHash())
  const [projectName, setProjectName] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(previewSession.isFullscreen())

  // Observe kernel state so we can decide whether to auto-load from storage.
  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), []),
    () => store.getState() as any,
    () => store.getState() as any
  )

  const hasAnyNodes = useMemo(() => {
    const nodesById = kernelState?.nodesById as Record<string, unknown> | undefined
    return nodesById ? Object.keys(nodesById).length > 0 : false
  }, [kernelState])

  const canvasMode = kernelState?.canvas?.mode ?? 'infinite'
  const canvasWidth = kernelState?.canvas?.width ?? 1920
  const canvasHeight = kernelState?.canvas?.height ?? 1080
  const hasGridNodes = useMemo(() => {
    const nodesById = kernelState?.nodesById as Record<string, any> | undefined
    if (!nodesById) return false
    return Object.values(nodesById).some((node: any) => Boolean(node?.schemaRef?.grid))
  }, [kernelState])
  const isGridLayout = canvasMode === 'grid' || hasGridNodes
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
  }

  useEffect(() => {
    const onHashChange = () => setParams(getPreviewParamsFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(previewSession.isFullscreen())
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type)
    return entry
  }, [])

  const applyProjectToStore = useCallback(async () => {
    if (!projectId) {
      setError('Missing projectId')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let project = await projectStorage.load(projectId)

      // If not in local storage, try loading from API (Cloud)
      if (!project) {
        try {
          const response = await dashboardsApi.getDashboard(projectId)
          if (response.data) {
            const dashboard = response.data
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
            }
          }
        } catch (apiErr) {
          console.warn('Failed to load from cloud:', apiErr)
        }
      }

      if (!project) {
        setError('Project not found')
        return
      }

      setProjectName(project.meta?.name)

      if (project.canvas) {
        store.getState().updateCanvas({
          mode: project.canvas.mode || 'infinite',
          width: project.canvas.width || 1920,
          height: project.canvas.height || 1080,
        })
        store.getState().setGridSettings?.({
          cols: project.canvas.gridCols ?? 24,
          rowHeight: project.canvas.gridRowHeight ?? 50,
          gap: project.canvas.gridGap ?? 5,
        })
      }

      const page: PageSchemaType = {
        id: project.meta?.id || projectId,
        type: 'page',
        version: project.meta?.version || '1.0.0',
        nodes: project.nodes || [],
      }

      store.getState().loadPage(page)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // If user navigates directly into preview (no editor state), auto-load once.
  useEffect(() => {
    if (!projectId) return
    if (hasAnyNodes) return
    void applyProjectToStore()
  }, [projectId, hasAnyNodes, applyProjectToStore])

  const handleBack = useCallback(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const isEmbedded = params.get('mode') === 'embedded'
    // projectId is already in state (projectId const)

    if (projectId) {
      if (isEmbedded) {
        window.location.hash = `#/editor/${projectId}?mode=embedded`
      } else {
        window.location.hash = `#/editor/${projectId}`
      }
    } else {
      window.location.hash = '#/'
    }
  }, [projectId])

  const handleRefresh = useCallback(() => {
    void applyProjectToStore()
  }, [applyProjectToStore])

  const handleToggleFullscreen = useCallback(() => {
    void previewSession.toggleFullscreen(document.documentElement)
  }, [])

  return (
    <div className="relative w-screen h-screen bg-background overflow-hidden">
      {/* Minimal overlay toolbar */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto">
        <div className="glass rounded-md shadow-md border border-border flex items-center gap-1 p-1">
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

          <div className="px-3 text-sm font-medium text-muted-foreground select-none whitespace-nowrap">
            预览模式
          </div>
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

      {/* Preview canvas */}
      <div className="absolute inset-0">
        {isGridLayout ? (
          <GridStackCanvas
            store={store as any}
            resolveWidget={resolveWidget as any}
            width={canvasWidth}
            height={canvasHeight}
            settings={gridSettings}
            interactive={false}
          />
        ) : (
          <CanvasView
            store={store as any}
            resolveWidget={resolveWidget as any}
            gridSize={0}
            snapToGrid={false}
            centeredMask={false}
          />
        )}
      </div>
    </div>
  )
}
