import React, { useEffect, useState, useCallback, useMemo, useRef, useImperativeHandle } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAuth } from "@/lib/auth/AuthContext"
import { useProject } from '@/contexts/ProjectContext'
import {
  MousePointer2,
  Square,
  Circle,
  ArrowRight,
  Type,
  ImageIcon,
  Hand,
  Search,
  Layers,
  Grid3x3,
  BarChart3,
  Box,
  Scan,
  PanelRightClose,
  Save,
  Video,
  Gauge,
  Clock,
  ToggleLeft,
  Map,
  Columns3,
  Table2,
  SlidersHorizontal,
  Film,
  TrendingUp,
  PieChart,
  Activity,
  Droplet,
  Play,
  Repeat,
  Globe,
  Frame,
  Folder,
  ChevronRight,
  EyeOff,
  Lock,
  X,
} from "lucide-react"

import { type KernelState, type KernelActions, dataSourceManager } from '@thingsvis/kernel'
import { type PageSchemaType, type NodeSchemaType, DEFAULT_CANVAS_THEME, validateCanvasTheme, type CanvasThemeId } from '@thingsvis/schema'
import CanvasView from './CanvasView'
import { GridStackCanvas } from '@thingsvis/ui'
import ComponentsList from './LeftPanel/ComponentsList'
import LayerPanel from './LeftPanel/LayerPanel'
import PropsPanel from './RightPanel/PropsPanel'

import { ShortcutHelpPanel } from './ShortcutHelpPanel'
import { ProjectDialog } from './ProjectDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// Data source management moved to separate page: #/data-sources
import { loadWidget } from '../lib/registry/componentLoader'
import { extractDefaults } from '../lib/registry/schemaUtils'
import { store } from '../lib/store'
import { useAutoSave } from '../hooks/useAutoSave'
import { useHistoryState } from '../hooks/useHistoryState'
import { useStorage } from '../hooks/useStorage'
import { projectStorage } from '../lib/storage/projectStorage'
import type { ProjectFile } from '../lib/storage/schemas'
import { recentProjects } from '../lib/storage/recentProjects'
import { createCloudStorageAdapter } from '../lib/storage/adapter'
import { STORAGE_CONSTANTS } from '../lib/storage/constants'
import { messageRouter, MSG_TYPES, onEmbedEvent, getEditMode, processEmbedInitPayload, initEmbedModeFromUrl, type EmbedInitPayload } from '../embed/message-router'

import { commandRegistry, useKeyboardShortcuts, registerDefaultCommands } from '../lib/commands'
import { pickImage, ImageFileTooLargeError, openImagePicker } from './tools/imagePicker'
import { EditorBottomBar } from './EditorBottomBar'
import { CanvasSettingsPanel } from './RightPanel/CanvasSettingsPanel'
import { EditorTopNav } from './EditorTopNav'

import { uploadFile } from "@/lib/api/uploads"
import { uploadImage as uploadToLocal } from "@/lib/imageUpload"

// Generate UUID helper
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

type Tool = "select" | "rectangle" | "circle" | "line" | "text" | "image" | "pan"
function DataPanel(_props: { store: typeof store; language: Language }) {
  return null;
}

// Define CanvasConfigSchema
type CanvasConfigSchema = {
  // Meta - 基础身份
  id: string
  projectId: string
  version: string
  name: string
  description: string
  thumbnail: string
  projectName?: string // Added for display
  scope: "app" | "template"
  params: string[]
  createdAt: number
  createdBy: string

  // Config - 画布配置
  mode: "fixed" | "infinite" | "grid"
  width: number
  height: number
  gridCols?: number
  gridRowHeight?: number
  gridGap?: number
  fullWidthPreview?: boolean  // 预览模式下是否撑满容器宽度
  homeFlag?: boolean  // 是否设为首页
  theme: "dawn" | "midnight" | string
  gridSize: number
  bgType: "color" | "image"
  bgValue: string
  bgColor: string // Added for color input
  bgImage: string // Added for image URL input

  // Global - 全局逻辑
  variables: Record<string, any>
  dataSources: Array<{ id: string; name: string; type: string; config: any }>

  // Legacy (保持向后兼容)
  background: string
  gridEnabled: boolean
}

// ─── Editor Props & Handle (Phase 1.6) ───

export interface EditorProps {
  /** 策略提供的 UI 可见性配置，覆盖默认 URL 解析逻辑 */
  embedVisibility?: {
    showLibrary: boolean
    showProps: boolean
    showTopLeft: boolean
    showToolbar: boolean
    showTopRight: boolean
    hideProjectDialog?: boolean
  }
  /** 是否为 Widget 模式 (禁用自动保存、跳过云端加载等) */
  isWidgetMode?: boolean
  /** 策略触发保存时的回调 */
  onStrategySave?: () => void
}

export interface EditorHandle {
  /** 获取当前项目状态 (用于策略保存) */
  getProjectState: () => ProjectFile
  /** 获取当前画布配置 */
  getCanvasConfig: () => CanvasConfigSchema
}

const Editor = React.forwardRef<EditorHandle, EditorProps>(function Editor(props, ref) {
  const { isAuthenticated, user, logout, isLoading: authLoading, storageMode } = useAuth()
  const { currentProject, switchProject } = useProject()


  // Fullscreen state for Embed Mode
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const [activeTool, setActiveTool] = useState<Tool>("select")
  // Initialize dark mode state from html class
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [leftPanelTab, setLeftPanelTab] = useState<"components" | "layers">("components")
  // Data source dialog removed - now uses separate page
  const [searchQuery, setSearchQuery] = useState("")
  const { t, i18n } = useTranslation('editor')
  const language = i18n.language as Language
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  // 跟踪云端模式下是否已选择画布（用于阻止用户在未选择画布时关闭对话框）
  // 惰性初始化：如果 localStorage 已有上次打开的项目 ID，视为已选择过，刷新后不再强制弹窗
  const [hasSelectedDashboard, setHasSelectedDashboard] = useState(() => {
    try {
      return !!localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY)
    } catch {
      return false
    }
  })
  // Image picker state for image tool (stores Object URL)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>(undefined)
  // 切换画布布局确认弹窗状态（替代原生 window.confirm）
  const [confirmLayoutSwitch, setConfirmLayoutSwitch] = useState<{
    open: boolean
    newMode: 'fixed' | 'infinite' | 'grid'
    onConfirm: () => void
  }>({ open: false, newMode: 'fixed', onConfirm: () => { } })

  const handleLogout = useCallback(() => {
    logout()
    window.location.hash = '#/'
  }, [logout])

  // Embed mode UI visibility from URL params
  // Phase 1.6: 优先使用策略提供的配置，回退到 URL 解析
  const embedVisibility = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const isEmbedded = params.get('mode') === 'embedded' || !!props.embedVisibility
    return {
      isEmbedded,
      showLibrary: props.embedVisibility?.showLibrary ?? (params.get('showLibrary') !== '0'),
      showProps: props.embedVisibility?.showProps ?? (params.get('showProps') !== '0'),
      showTopLeft: props.embedVisibility?.showTopLeft ?? (params.get('showTopLeft') !== '0'),
      showToolbar: props.embedVisibility?.showToolbar ?? (params.get('showToolbar') !== '0'),
      showTopRight: props.embedVisibility?.showTopRight ?? (params.get('showTopRight') !== '0'),
      hideProjectDialog: props.embedVisibility?.hideProjectDialog ?? false,
    }
  }, [props.embedVisibility])

  const kernelState = useSyncExternalStore(
    useCallback(subscribe => store.subscribe(subscribe), []),
    () => store.getState() as KernelState
  );

  const selectedElement = kernelState.selection.nodeIds[0] || null;

  // Sync dark mode state with html class on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  // 🔑 在嵌入模式下初始化 SaveStrategy (只执行一次)
  const embedInitializedRef = useRef(false);
  useEffect(() => {
    if (embedVisibility.isEmbedded && !embedInitializedRef.current) {
      embedInitializedRef.current = true;
      initEmbedModeFromUrl(isAuthenticated);
    }
  }, [embedVisibility.isEmbedded, isAuthenticated])



  // Prompt project creation after login if no project exists
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) return
    if (embedVisibility.isEmbedded) return
    // 云端模式下，强制显示对话框让用户选择画布
    if (storageMode === 'cloud' && !hasSelectedDashboard) {
      setShowProjectDialog(true)
    }
  }, [authLoading, isAuthenticated, storageMode, hasSelectedDashboard, embedVisibility.isEmbedded])

  const [zoom, setZoom] = useState(80)
  const [zoomInput, setZoomInput] = useState("80")
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showLeftPanel, setShowLeftPanel] = useState(() => {
    // When top-right controls are hidden, keep the library panel reachable by default.
    return embedVisibility.showLibrary && !embedVisibility.showTopRight
  })

  // Update zoom input when zoom changes externally
  useEffect(() => {
    setZoomInput(zoom.toString())
  }, [zoom])

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value)
  }

  const handleZoomInputBlur = () => {
    let value = parseInt(zoomInput.replace(/[^0-9]/g, ''), 10)
    if (isNaN(value)) value = 100
    value = Math.max(10, Math.min(500, value))
    setZoom(value)
    setZoomInput(value.toString())
  }

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleZoomInputBlur()
      e.currentTarget.blur()
    }
  }

  // Auto-open right panel when a node is selected
  useEffect(() => {
    if (selectedElement) {
      setShowRightPanel(true)
    }
  }, [selectedElement])

  // Keep left panel reachable under embed visibility constraints.
  useEffect(() => {
    if (!embedVisibility.showLibrary) {
      setShowLeftPanel(false)
      return
    }
    if (!embedVisibility.showTopRight) {
      setShowLeftPanel(true)
    }
  }, [embedVisibility.showLibrary, embedVisibility.showTopRight])

  // Toggle left panel
  const toggleLeftPanel = useCallback(() => {
    setShowLeftPanel(prev => !prev)
  }, [])

  // Subscribe to temporal history
  const temporalSnapshot = useSyncExternalStore(
    useCallback(
      subscribe => {
        const unsub = store.temporal.subscribe(subscribe)
        return unsub
      },
      []
    ),
    () => store.temporal.getState(),
    () => store.temporal.getState()
  )


  const { dashboardId } = useParams<{ dashboardId: string }>()

  // Resolve initial project id from URL/hash, last-opened id, or recents.
  // Strategy Pattern: Route > Query > Storage > Generic
  const resolveInitialProjectId = useCallback((): string => {
    // 0) Priority: Route Path Parameter (New App Mode)
    // URL: /editor/:dashboardId
    if (dashboardId) {
      return dashboardId;
    }

    // 1) URL hash query: #/editor?projectId=... (Legacy / Dev)
    try {
      const hash = window.location.hash || ''
      const qIndex = hash.indexOf('?')
      if (qIndex >= 0) {
        const params = new URLSearchParams(hash.slice(qIndex + 1))
        const fromHash = params.get('projectId')
        if (fromHash) {
          return fromHash
        }
      }
    } catch { }

    // 2) localStorage last opened project (Fallback)
    try {
      const last = localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY)
      if (last) {
        return last
      }
    } catch { }

    // 3) first recent project
    const recent = recentProjects.get()[0]?.id
    if (recent) return recent

    // 4) new
    return generateId()
  }, [dashboardId])

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfigSchema>(() => {
    const initialId = resolveInitialProjectId()
    // 🆕 embed 模式默认使用 grid 布局
    const defaultMode = embedVisibility.isEmbedded ? "grid" : "fixed"
    return {
      // Meta - 基础身份
      id: initialId,
      projectId: "",
      version: "1.0.0",
      name: "My Visualization",
      description: "",
      thumbnail: "",
      scope: "app" as "app" | "template",
      params: [] as string[],
      createdAt: Date.now(),
      createdBy: "user-001",

      // Config - 画布配置
      mode: defaultMode as "fixed" | "infinite" | "grid",
      width: 1920,
      height: 1080,
      gridCols: 24,
      gridRowHeight: 50,
      gridGap: 5,
      theme: DEFAULT_CANVAS_THEME as CanvasThemeId,
      gridSize: 20,
      bgType: "color" as "color" | "image",
      bgValue: "#1a1a1a",
      bgColor: "#1a1a1a", // Initial value for color input
      bgImage: "", // Initial value for image URL input

      // Global - 全局逻辑
      variables: {} as Record<string, any>,
      dataSources: [] as Array<{ id: string; name: string; type: string; config: any }>,

      // Legacy (保持向后兼容)
      background: "#1a1a1a",
      gridEnabled: true,
    }
  })

  // Single source of truth for persistence id
  const projectId = canvasConfig.id
  const bootstrappingRef = useRef(true)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  // 获取正确的存储适配器（根据嵌入模式/认证状态自动选择）
  const storage = useStorage(projectId)

  // Function to get current project state for saving
  const getProjectState = useCallback((): ProjectFile => {
    const state = store.getState()
    // Extract node schemas from NodeState (schemaRef contains the actual node data), preserving layer order
    const nodes = state.layerOrder
      .map(id => state.nodesById[id]?.schemaRef)
      .filter((schema): schema is NodeSchemaType => Boolean(schema))

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
        background: canvasConfig.bgValue,
        gridCols: canvasConfig.gridCols,
        gridRowHeight: canvasConfig.gridRowHeight,
        gridGap: canvasConfig.gridGap,
        gridEnabled: canvasConfig.gridEnabled,
        gridSize: canvasConfig.gridSize,
        fullWidthPreview: canvasConfig.fullWidthPreview,
        homeFlag: canvasConfig.homeFlag,
      },
      nodes: nodes,
      dataSources: dataSourceManager.getAllConfigs(),
    }
  }, [projectId, canvasConfig])

  // ─── Phase 1.6: Expose handle to EditorShell ───
  useImperativeHandle(ref, () => ({
    getProjectState,
    getCanvasConfig: () => canvasConfig,
  }), [getProjectState, canvasConfig])

  // Helper to identify Widget Mode
  // Phase 1.6: 优先使用 props.isWidgetMode（由策略提供），回退到内联检测
  const isWidgetMode = props.isWidgetMode ?? (embedVisibility.isEmbedded && (projectId === 'widget' || projectId.startsWith('embed-')));

  // Auto-save hook
  const { saveState, markDirty, saveNow } = useAutoSave({
    projectId,
    cloudProjectId: currentProject?.id,
    getProjectState,
    enabled: !isBootstrapping && !isWidgetMode, // Disable auto-save in Widget Mode
    onIdChange: (newId) => {
      setCanvasConfig(prev => ({
        ...prev,
        id: newId,
      }))
      try {
        localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, newId)
      } catch { }
    },
  })

  // Track whether canvas config has been initialized after bootstrapping
  // (reset when projectId changes to avoid marking dirty on initial load)
  const canvasInitializedRef = useRef(false)

  // Bootstrap: load last project into store (or create a new empty page)
  useEffect(() => {
    let cancelled = false
    // Reset canvasInitializedRef when projectId changes
    canvasInitializedRef.current = false
      ; (async () => {
        bootstrappingRef.current = true
        setIsBootstrapping(true)

        try {
          // 🔑 根据存储模式选择加载来源
          // - 嵌入模式 (isCloud=true): 从云端 API 加载
          // - 本地模式 (isCloud=false): 从 IndexedDB 加载
          let loaded: ProjectFile | null = null;

          if (storage.isCloud) {
            // Widget Mode: Host-managed project should not fetch from cloud
            // If we are in embed mode and the project ID is assigned by Host (e.g. 'widget' or 'embed-*'),
            // it means the project data comes from postMessage, NOT from the cloud.
            // Fetching from cloud will return 404 and cause fallback to empty project, wiping out our init data.
            const isHostProject = embedVisibility.isEmbedded && (projectId === 'widget' || projectId.startsWith('embed-'));

            if (isHostProject) {
              // Data is already loaded via onEmbedInit.
              // We must stop bootstrapping here to prevent 'loaded=null' from triggering the empty project fallback.
              bootstrappingRef.current = false;
              setIsBootstrapping(false);
              return;
            }

            // 🛑 New Mode Guard: If we are in Widget Mode but somehow got here with a non-host ID,
            // we should STILL not try to load from cloud if we are adhering to strict isolation.
            // However, for now, we'll assume if it's not a host-project ID, it might be a legacy embed case.
            // Ideally: if (embedVisibility.isEmbedded) { return; }
            try {
              const cloudProject = await storage.get(projectId);
              if (cloudProject) {
                loaded = {
                  meta: {
                    version: '1.0.0',
                    id: cloudProject.meta.id,
                    name: cloudProject.meta.name,
                    thumbnail: cloudProject.meta.thumbnail, // Load thumbnail
                    projectId: cloudProject.meta.projectId,
                    projectName: cloudProject.meta.projectName,
                    createdAt: cloudProject.meta.createdAt,
                    updatedAt: cloudProject.meta.updatedAt,
                  },
                  canvas: cloudProject.schema.canvas,
                  nodes: cloudProject.schema.nodes,
                  dataSources: cloudProject.schema.dataSources,
                };

                // Sync Project Context if needed
                if (cloudProject.meta.projectId && currentProject?.id !== cloudProject.meta.projectId) {
                  // Don't await to avoid blocking UI
                  switchProject(cloudProject.meta.projectId).catch(console.error);
                }
              }
            } catch (err) {
              console.error('[Editor] Bootstrap: Cloud load failed', err);
              // Fallback to empty project is handled below if loaded remains null
            }
          } else {
            loaded = await projectStorage.load(projectId);
          }

          if (cancelled) return
          if (loaded) {
            // Load project into kernel store
            store.getState().loadPage({
              id: loaded.meta.id,
              type: 'page' as const,
              version: loaded.meta.version,
              nodes: loaded.nodes,
              config: {
                mode: loaded.canvas.mode,
                width: loaded.canvas.width,
                height: loaded.canvas.height,
                theme: validateCanvasTheme((loaded.canvas as any).theme),
              }
            })
            // Update canvas config
            setCanvasConfig(prev => ({
              ...prev,
              id: loaded.meta.id,
              name: loaded.meta.name,
              thumbnail: loaded.meta.thumbnail || "", // Load thumbnail
              projectId: loaded.meta.projectId || prev.projectId,
              projectName: loaded.meta.projectName, // Load project name
              createdAt: loaded.meta.createdAt,
              mode: loaded.canvas.mode,
              width: loaded.canvas.width,
              height: loaded.canvas.height,
              bgValue: loaded.canvas.background,
              gridCols: loaded.canvas.gridCols ?? prev.gridCols,
              gridRowHeight: loaded.canvas.gridRowHeight ?? prev.gridRowHeight,
              gridGap: loaded.canvas.gridGap ?? prev.gridGap,
              gridEnabled: loaded.canvas.gridEnabled ?? prev.gridEnabled,
              gridSize: loaded.canvas.gridSize ?? prev.gridSize,
              dataSources: (loaded.dataSources as any) ?? prev.dataSources,
            }))

            // Restore data source connections from saved config
            if (loaded.dataSources && Array.isArray(loaded.dataSources)) {
              for (const ds of loaded.dataSources) {
                try {
                  await dataSourceManager.registerDataSource(ds as any, false)
                } catch (e) {
                  console.warn(`[Editor] Failed to restore data source ${ds.id}:`, e)
                }
              }
            }

            // Sync grid settings to kernel store if in grid mode
            if (loaded.canvas.mode === 'grid') {
              store.getState().setGridSettings({
                cols: loaded.canvas.gridCols ?? 24,
                rowHeight: loaded.canvas.gridRowHeight ?? 50,
                gap: loaded.canvas.gridGap ?? 5,
                compactVertical: true,
                minW: 1,
                minH: 1,
                showGridLines: loaded.canvas.gridEnabled ?? true,
                breakpoints: [],
                responsive: true,
              })
            }

            // Clear undo history when switching/loading projects (best-effort)
            try {
              store.temporal.getState().clear?.()
            } catch { }
          } else {
            // Create new empty project page
            store.getState().loadPage({
              id: projectId,
              type: 'page' as const,
              version: '1.0.0',
              nodes: [],
              config: {
                mode: canvasConfig.mode,
                width: canvasConfig.width,
                height: canvasConfig.height,
                theme: canvasConfig.theme as any, // Fix lint: Add theme
              }
            })
            try {
              store.temporal.getState().clear?.()
            } catch { }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Editor] Bootstrap error:', e);
        } finally {
          if (cancelled) return
          bootstrappingRef.current = false
          setIsBootstrapping(false)
        }
      })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, storage.isCloud])

  // Mark dirty on meaningful changes only:
  // - explicit user edits (node add/move/resize/props/etc.)
  // - canvas config changes that affect persistence
  useEffect(() => {
    if (bootstrappingRef.current) return
    // Skip the first effect after bootstrapping completes
    // (React state updates are async so canvasConfig changes after bootstrappingRef.current = false)
    if (!canvasInitializedRef.current) {
      canvasInitializedRef.current = true
      return
    }
    markDirty()
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
    canvasConfig.gridEnabled,
    canvasConfig.gridSize,
    canvasConfig.thumbnail, // Trigger save on thumbnail change
  ])

  // 🔑 订阅 store 节点变化，自动触发 markDirty
  // 这样无论节点是通过什么方式（添加、删除、粘贴、属性修改等）变化的，
  // 都会自动触发保存，而不需要在每个调用点手动添加 markDirty
  useEffect(() => {
    if (isBootstrapping) return

    // Initialize with current state to avoid marking dirty on subscription setup
    const state = store.getState()
    let prevNodesById: any = state.nodesById
    let prevLayerOrder: any = state.layerOrder
    let prevDataSourceStates: any = (state as any).dataSourceStates

    const unsubscribe = store.subscribe(() => {
      if (bootstrappingRef.current) return

      const currentState = store.getState()
      const nodesById = currentState.nodesById
      const layerOrder = currentState.layerOrder
      const dataSourceStates = (currentState as any).dataSourceStates

      // 比较引用是否变化（zustand 在状态变化时会创建新引用）
      if (nodesById !== prevNodesById || layerOrder !== prevLayerOrder || dataSourceStates !== prevDataSourceStates) {
        prevNodesById = nodesById
        prevLayerOrder = layerOrder
        prevDataSourceStates = dataSourceStates
        markDirty()
      }
    })

    return unsubscribe
  }, [isBootstrapping, markDirty])

  const openPreview = useCallback(async () => {
    // Ensure preview loads the latest saved content
    await saveNow()

    if (embedVisibility.isEmbedded) {
      // 🆕 Embed Mode specific routing
      // Use internal hash routing to stay within the iframe/context
      // unless user specifically wants popups (which is rare in dashboards)
      const previewHash = `#/preview?projectId=${encodeURIComponent(projectId)}&mode=embedded`
      window.location.hash = previewHash
      return
    }

    const previewHash = `#/preview?projectId=${encodeURIComponent(projectId)}`

    // Open a new tab synchronously to avoid popup blockers.
    // We'll navigate it to the preview URL after the save completes.
    const previewWindow = window.open('about:blank', '_blank')

    const url = new URL(window.location.href)
    url.hash = previewHash

    if (previewWindow) {
      previewWindow.location.href = url.toString()
      previewWindow.focus?.()
      return
    }

    // Popup blocked: fall back to same-tab navigation.
    window.location.hash = previewHash
  }, [projectId, saveNow])

  // Open publish - publishes the dashboard
  const openPublish = useCallback(async () => {
    // Ensure latest content is saved before publishing
    await saveNow()

    if (embedVisibility.isEmbedded) {
      // In embed mode, notify the host to handle publish
      messageRouter.send('tv:publish', undefined, { projectId })
      return
    }

    // In standalone mode, call publish API directly
    try {
      const response = await fetch(`/api/v1/dashboards/${projectId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        // 可以在这里显示成功提示，或者触发一个状态更新
      } else {
        console.error('[Editor] Failed to publish dashboard:', response.statusText)
      }
    } catch (error) {
      console.error('[Editor] Publish error:', error)
    }
  }, [projectId, saveNow])

  // Register default commands with the command registry
  useEffect(() => {
    registerDefaultCommands({
      saveProject: async () => { await saveNow() },
      getKernelState: () => store.getState() as KernelState,
      deleteNodes: (ids) => store.getState().removeNodes(ids),
      undo: () => store.temporal.getState().undo(),
      redo: () => store.temporal.getState().redo(),
      canUndo: () => {
        const temporal = store.temporal.getState()
        const past = (temporal.pastStates ?? []) as unknown[]
        return past.length > 0
      },
      canRedo: () => {
        const temporal = store.temporal.getState()
        const future = (temporal.futureStates ?? []) as unknown[]
        return future.length > 0
      },
      showShortcutsPanel: () => setShowShortcuts(true),
      setTool: (tool) => setActiveTool(tool as Tool),
      openProjectDialog: () => setShowProjectDialog(true),
      openPreview,
      logout: handleLogout,
      // Atomic insert nodes + select: ensures undo/redo captures both operations together
      // We create a partial state update that includes both nodesById and selection changes
      // This ensures the temporal middleware captures both in a single history entry
      applyNodeInsertAndSelect: (nodes, selectIds) => {
        const currentState = store.getState()

        // Build the new nodesById with added nodes
        const newNodesById = { ...currentState.nodesById }
        const newLayerOrder = [...currentState.layerOrder]

        nodes.forEach(node => {
          newNodesById[node.id] = {
            id: node.id,
            schemaRef: node,
            visible: true,
            locked: false, // Pasted/duplicated nodes are always unlocked
          }
          // Add to layer order if not already present
          if (!newLayerOrder.includes(node.id)) {
            newLayerOrder.push(node.id)
          }
        })

        // Apply the combined state change
        store.setState({
          nodesById: newNodesById,
          layerOrder: newLayerOrder,
          selection: { nodeIds: selectIds },
        })
      },
    })
  }, [saveNow, projectId, openPreview])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ registry: commandRegistry })

  // Phase 1.8: triggerSave 逻辑已迁移到 EditorShell.tsx
  // EditorShell 通过 editorRef.getProjectState() 获取数据并调用 strategy.save()

  // Handle embed mode init event - load initial data from host
  useEffect(() => {
    if (!embedVisibility.isEmbedded) return;

    const unsubscribe = onEmbedEvent('init', async (payload: EmbedInitPayload) => {
      // 使用新的处理函数解析数据
      const processed = processEmbedInitPayload(payload);
      if (!processed) {
        console.warn('[Editor] ⚠️ embed init 数据无效');
        return;
      }

      // 🔑 saveTarget='self' 时，从 ThingsVis 云端获取节点（包含 data 绑定字段）
      let nodesToLoad = processed.nodes;
      let loadedMeta: any = null;
      let loadedCanvas: any = null;
      if (processed.saveTarget === 'self' && processed.projectId) {
        try {
          const cloudAdapter = createCloudStorageAdapter();
          const cloudProject = await cloudAdapter.get(processed.projectId);
          if (cloudProject) {
            if (cloudProject.schema.nodes.length > 0) {
              nodesToLoad = cloudProject.schema.nodes;
            }
            loadedMeta = cloudProject.meta;
            // schema 里的 canvas 或者根级的 canvas (适配不同的 schema version)
            loadedCanvas = cloudProject.canvas || cloudProject.schema?.canvas;
          }
        } catch (err) {
          console.warn('[Editor] ⚠️ 获取云端数据失败，使用宿主传来的数据:', err);
        }
      }

      // 🔑 关键修复：使用宿主传来的项目 ID 更新 canvasConfig。云端模式下优先使用云端获取的数据
      setCanvasConfig(prev => ({
        ...prev,
        id: processed.projectId, // 使用宿主传来的 ID
        name: loadedMeta?.name || processed.projectName,
        mode: (loadedCanvas?.mode || processed.canvas.mode) as any,
        width: loadedCanvas?.width || processed.canvas.width,
        height: loadedCanvas?.height || processed.canvas.height,
        bgValue: loadedCanvas?.background || processed.canvas.background,
        gridCols: loadedCanvas?.gridCols || processed.canvas.gridCols,
        gridRowHeight: loadedCanvas?.gridRowHeight || processed.canvas.gridRowHeight,
        gridGap: loadedCanvas?.gridGap || processed.canvas.gridGap,
        fullWidthPreview: loadedCanvas?.fullWidthPreview || processed.canvas.fullWidthPreview,
        thumbnail: loadedMeta?.thumbnail || processed.thumbnail || "", // Load thumbnail
      }));

      // 加载节点到 store，使用正确的项目 ID
      if (nodesToLoad.length > 0) {
        store.getState().loadPage({
          id: processed.projectId, // 🔑 使用宿主传来的 ID
          type: 'page' as const,
          version: '1.0.0',
          nodes: nodesToLoad,
          config: {
            mode: processed.canvas.mode as any,
            width: processed.canvas.width,
            height: processed.canvas.height,
            theme: 'dark',
            gridSettings: {
              cols: processed.canvas.gridCols ?? 24,
              rowHeight: processed.canvas.gridRowHeight ?? 50,
              gap: processed.canvas.gridGap ?? 5,
              compactVertical: false,
              responsive: false,
              minW: 1,
              minH: 1,
              showGridLines: true,
              breakpoints: []
            },
          },
        });

        // Clear undo history for clean start
        try {
          store.temporal.getState().clear?.();
        } catch { }
      }
    });



    return () => {
      unsubscribe();
    }
  }, [])

  // Phase 1.8: request-save 逻辑已迁移到 EditorShell.tsx
  // EditorShell 监听 'tv:request-save' 并通过 editorRef 获取数据


  // 🆕 在 bootstrapping 完成后发送握手请求
  useEffect(() => {
    if (!embedVisibility.isEmbedded) return
    if (bootstrappingRef.current) return // 还在加载中
    if (isBootstrapping) return
    // 发送 ready 消息
    messageRouter.send(MSG_TYPES.READY)
    // 主动请求初始数据
    setTimeout(() => {
      messageRouter.send(MSG_TYPES.REQUEST_INIT)
    }, 100) // 轻微延迟确保 ready 消息先到达
  }, [isBootstrapping])

  // ─── Phase 3.2: Bidirectional Canvas Sync ───
  // Forward: canvasConfig → kernel (when user changes mode/width/height in UI)
  // Reverse: kernel → canvasConfig (when external source changes canvas, e.g. loadPage)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (syncingRef.current) return
    syncingRef.current = true
    store.getState().updateCanvas({
      mode: canvasConfig.mode,
      width: canvasConfig.width,
      height: canvasConfig.height
    })
    syncingRef.current = false
  }, [canvasConfig.mode, canvasConfig.width, canvasConfig.height])

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      if (syncingRef.current) return
      const kernelCanvas = state.canvas
      setCanvasConfig(prev => {
        if (
          prev.mode === kernelCanvas.mode &&
          prev.width === kernelCanvas.width &&
          prev.height === kernelCanvas.height
        ) return prev

        syncingRef.current = true
        const next = {
          ...prev,
          mode: kernelCanvas.mode,
          width: kernelCanvas.width,
          height: kernelCanvas.height,
        }
        syncingRef.current = false
        return next
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const { setGridSettings } = store.getState()
    if (!setGridSettings) return
    setGridSettings({
      cols: canvasConfig.gridCols ?? 24,
      rowHeight: canvasConfig.gridRowHeight ?? 50,
      gap: canvasConfig.gridGap ?? 5,
    })
  }, [canvasConfig.gridCols, canvasConfig.gridRowHeight, canvasConfig.gridGap])

  const { canUndo, canRedo } = useMemo(() => {
    const past = temporalSnapshot.pastStates ?? []
    const future = temporalSnapshot.futureStates ?? []
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0
    }
  }, [temporalSnapshot])

  const handleUndo = useCallback(() => {
    store.temporal.getState().undo()
  }, [])

  const handleRedo = useCallback(() => {
    store.temporal.getState().redo()
  }, [])

  const handleAddNode = useCallback(async (componentType: string) => {
    try {
      const { entry } = await loadWidget(componentType)
      const defaultProps = extractDefaults(entry.schema)
      const now = Date.now()

      // Calculate grid position for new widget
      const existingNodes = Object.values(store.getState().nodesById)
      let gridY = 0
      existingNodes.forEach((n: any) => {
        const g = n.schemaRef?.grid
        if (g) {
          gridY = Math.max(gridY, (g.y ?? 0) + (g.h ?? 2))
        }
      })

      const node: NodeSchemaType = {
        id: `node-${componentType}-${now}`,
        type: componentType,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 80 },
        props: defaultProps,
        // Add grid position for grid layout mode
        grid: { x: 0, y: gridY, w: 4, h: 3 },
      }
      store.getState().addNodes([node])
    } catch (e) {

    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Handle image picker request from CreateToolLayer
  const handleImagePickerRequest = useCallback(async () => {
    try {
      const file = await openImagePicker()
      if (!file) {
        // User canceled - reset to select tool
        setActiveTool('select')
        setPendingImageUrl(undefined)
        return
      }

      // Check max size 10MB (consistent with ImageSourceInput)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('alerts.imageTooLarge'))
        setActiveTool('select')
        setPendingImageUrl(undefined)
        return
      }

      // Check login status
      const isLoggedIn = !!localStorage.getItem('thingsvis_token')
      let url = ''

      if (isLoggedIn) {
        // Upload to server
        const result = await uploadFile(file)
        if (result.error) {
          throw new Error(result.error)
        }
        if (result.data) {
          url = result.data.url
        }
      } else {
        // Upload to local indexedDB
        url = await uploadToLocal(file)
      }

      if (url) {
        setPendingImageUrl(url)
      } else {
        throw new Error('Failed to get image URL')
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Image picker error:', error)
      alert(t('alerts.imageUploadFailed'))
      setActiveTool('select')
      setPendingImageUrl(undefined)
    }
  }, [language])

  // Handle image creation complete
  const handleImagePickerComplete = useCallback(() => {
    // Data URL is stored in node props - no cleanup needed
    setPendingImageUrl(undefined)
    setActiveTool('select')
  }, [])

  // Reset tool to select (used by image tool on cancel)
  const handleResetTool = useCallback(() => {
    setActiveTool('select')
    setPendingImageUrl(undefined)
  }, [pendingImageUrl])

  const tools = [
    { id: "select" as Tool, icon: MousePointer2, label: "选择" },
    { id: "rectangle" as Tool, icon: Square, label: "矩形" },
    { id: "circle" as Tool, icon: Circle, label: "圆形" },
    { id: "line" as Tool, icon: ArrowRight, label: "连线" },
    { id: "pan" as Tool, icon: Hand, label: "移动" },
    { id: "image" as Tool, icon: ImageIcon, label: "图片" },
    { id: "text" as Tool, icon: Type, label: "文本" },
  ]

  const shortcuts = [
    { key: "Ctrl/⌘ + O", action: t('shortcuts.open') },
    { key: "Ctrl/⌘ + S", action: t('shortcuts.save') },
    { key: "Ctrl/⌘ + Z", action: t('shortcuts.undo') },
    { key: "Ctrl/⌘ + Shift + Z", action: t('shortcuts.redo') },
    { key: "V", action: t('shortcuts.selectTool') },
    { key: "R", action: t('shortcuts.rectangleTool') },
    { key: "O", action: t('shortcuts.circleTool') },
    { key: "T", action: t('shortcuts.textTool') },
    { key: "H", action: t('shortcuts.panCanvas') },
    { key: "Delete", action: t('shortcuts.deleteSelected') },
    { key: "Ctrl/⌘ + D", action: t('shortcuts.duplicate') },
    { key: "Ctrl/⌘ + G", action: t('shortcuts.group') },
    { key: "?", action: t('shortcuts.title') },
  ]

  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type);
    return entry;
  }, []);

  return (
    <div className={isDarkMode ? "dark relative min-h-screen overflow-hidden" : "relative min-h-screen overflow-hidden"}>
      {/* Canvas Background with Dot Grid */}
      <div className="absolute inset-0 bg-background" />

      {/* Canvas View - switch between normal and grid mode */}
      <div className="absolute inset-0 z-0">
        {canvasConfig.mode === 'grid' ? (
          <GridStackCanvas
            store={store}
            width={canvasConfig.width}
            height={canvasConfig.height}
            activeTool={activeTool}
            zoom={zoom / 100}
            theme={canvasConfig.theme}
            onZoomChange={(newZoom) => setZoom(Math.round(newZoom * 100))}
            settings={{
              cols: canvasConfig.gridCols ?? 24,
              rowHeight: canvasConfig.gridRowHeight ?? 10,
              gap: canvasConfig.gridGap ?? 5,
              margin: canvasConfig.gridGap ?? 5,
              showGridLines: true,
              compactVertical: true,
              responsive: [],
            }}
            centerPadding={{
              left: embedVisibility.showLibrary && showLeftPanel ? 320 : 0,
              right: embedVisibility.showProps && showRightPanel ? 340 : 0
            }}
            resolveWidget={resolveWidget}
            onNodeChange={(nodeId, position) => {
              // Update node grid position in kernel store
              const state = store.getState();
              const node = state.nodesById[nodeId];
              if (node) {
                store.getState().updateNode(nodeId, {
                  grid: position,
                });
                markDirty();
              }
            }}
            onDropComponent={async (componentType, gridPosition) => {
              // Handle component dropped from sidebar
              try {
                const { entry } = await loadWidget(componentType);
                const defaultProps = extractDefaults(entry.schema);
                const now = Date.now();
                const node = {
                  id: `node-${componentType}-${now}`,
                  type: componentType,
                  position: { x: 100, y: 100 },
                  size: { width: 200, height: 80 },
                  props: defaultProps,
                  grid: {
                    ...gridPosition,
                    static: false,
                    isDraggable: true,
                    isResizable: true,
                  },
                };
                store.getState().addNodes([node]);
                markDirty();
              } catch (e) {

              }
            }}
          />
        ) : (
          <CanvasView
            pageId={canvasConfig.id}
            store={store}
            activeTool={activeTool}
            resolveWidget={resolveWidget}
            zoom={zoom / 100}
            theme={canvasConfig.theme}
            onZoomChange={(newZoom) => setZoom(Math.round(newZoom * 100))}
            onUserEdit={markDirty}
            onResetTool={handleResetTool}
            pendingImageUrl={pendingImageUrl}
            onImagePickerRequest={handleImagePickerRequest}
            onImagePickerComplete={handleImagePickerComplete}
            centerPadding={{
              left: embedVisibility.showLibrary && showLeftPanel ? 320 : 0,
              right: embedVisibility.showProps && showRightPanel ? 340 : 0
            }}
          />
        )}
      </div>

      {/* Top Navigation Bar */}
      <EditorTopNav
        canvasMode={canvasConfig.mode}
        tools={tools}
        activeTool={activeTool}
        isDarkMode={isDarkMode}
        isEmbedded={embedVisibility.isEmbedded}
        showTopLeft={embedVisibility.showTopLeft}
        showToolbar={embedVisibility.showToolbar}
        showTopRight={embedVisibility.showTopRight}
        showRightPanel={showRightPanel}
        showLibrary={embedVisibility.showLibrary}
        isFullscreen={!!document.fullscreenElement}
        saveStatus={saveState.status}
        lastSavedAt={saveState.lastSavedAt}
        saveError={saveState.error}
        isSaving={saveState.status === 'saving'}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        user={user as any}
        projectName={canvasConfig.name}
        projectId={projectId}
        onToolChange={setActiveTool}
        onProjectNameChange={(name: string) => setCanvasConfig({ ...canvasConfig, name })}
        onSave={() => saveNow()}
        onPreview={openPreview}
        onPublish={openPublish}
        onToggleTheme={toggleTheme}
        onToggleRightPanel={() => setShowRightPanel(true)}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={toggleLeftPanel}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { })
          } else if (document.exitFullscreen) {
            document.exitFullscreen()
          }
        }}
        onOpenProjectDialog={() => setShowProjectDialog(true)}
        onOpenDataSources={async () => {
          if (embedVisibility.isEmbedded) {
            await saveNow()
            window.location.hash = `#/data-sources?projectId=${encodeURIComponent(projectId)}&mode=embedded`
          } else {
            window.open('#/data-sources', '_blank')
          }
        }}
        onLogout={() => { logout(); window.location.hash = '#/' }}
        onLogin={() => { window.location.hash = '#/login' }}
      />

      {/* Left Panel: Assets & Layers */}
      {embedVisibility.showLibrary && showLeftPanel && (
        <aside className={`absolute left-4 ${embedVisibility.isEmbedded
          ? (embedVisibility.showTopLeft || embedVisibility.showTopRight)
            ? 'top-20' // 顶部工具栏显示时留出空间
            : 'top-4'
          : 'top-20'
          } bottom-4 z-40 w-72`}>
          <div className="glass rounded-xl shadow-2xl border border-border/50 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
              <div className="flex flex-1">
                <button
                  onClick={() => setLeftPanelTab("components")}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-all rounded-lg ${leftPanelTab === "components"
                    ? "text-foreground bg-accent/80 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  {t('leftPanel.library')}
                </button>
                <button
                  onClick={() => setLeftPanelTab("layers")}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-all rounded-lg ${leftPanelTab === "layers"
                    ? "text-foreground bg-accent/80 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    }`}
                >
                  <Layers className="h-4 w-4" />
                  {t('leftPanel.layers')}
                </button>
              </div>
              {embedVisibility.showTopRight && (
                <button
                  className="p-1.5 ml-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setShowLeftPanel(false)}
                  title={t('common.close')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {leftPanelTab === "components" ? (
                <div>
                  <ComponentsList onInsert={handleAddNode} language={language} />
                </div>
              ) : leftPanelTab === "layers" ? (
                <LayerPanel store={store} language={language} searchQuery={searchQuery} onUserEdit={markDirty} />
              ) : (
                <DataPanel store={store} language={language} />
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Controls: Zoom, Undo/Redo, Help */}
      <EditorBottomBar
        zoom={zoom}
        zoomInput={zoomInput}
        canUndo={canUndo}
        canRedo={canRedo}
        showLeftPanel={showLeftPanel}
        showProps={embedVisibility.showProps}
        showRightPanel={showRightPanel}
        canvasWidth={canvasConfig.width}
        canvasHeight={canvasConfig.height}
        onZoomChange={setZoom}
        onZoomInputChange={setZoomInput}
        onZoomInputBlur={handleZoomInputBlur}
        onZoomInputKeyDown={handleZoomInputKeyDown}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Right Panel - Properties */}
      {embedVisibility.showProps && showRightPanel && (
        <aside className={`absolute right-4 ${embedVisibility.isEmbedded
          ? (embedVisibility.showTopLeft || embedVisibility.showTopRight)
            ? 'top-20' // 顶部工具栏显示时留出空间
            : 'top-4'
          : 'top-20'
          } bottom-4 w-80 z-40`}>
          <div className="glass rounded-xl shadow-2xl border border-border/50 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h2 className="text-sm font-semibold">{t('propsPanel.title')}</h2>
              <button
                className="p-1.5 hover:bg-accent/80 rounded-lg transition-colors"
                onClick={() => {
                  if (selectedElement) {
                    store.getState().selectNode(null)
                  } else {
                    setShowRightPanel(false)
                  }
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedElement ? (
                <PropsPanel
                  nodeId={selectedElement}
                  kernelStore={store}
                  language={language}
                  onUserEdit={markDirty}
                />
              ) : (
                <CanvasSettingsPanel
                  language={language}
                  canvasConfig={canvasConfig}
                  currentProjectName={currentProject?.name}
                  isEmbedded={embedVisibility.isEmbedded}
                  onConfigChange={setCanvasConfig}
                  onLayoutModeChange={(newMode: 'fixed' | 'infinite' | 'grid') => {
                    const hasNodes = Object.keys(store.getState().nodesById).length > 0;
                    // 嵌入模式或画布为空：直接切换，无需确认
                    if (embedVisibility.isEmbedded || !hasNodes) {
                      setCanvasConfig(prev => ({ ...prev, mode: newMode }))
                      return true;
                    }
                    // 有节点时：打开自定义确认弹窗，替代原生 window.confirm
                    setConfirmLayoutSwitch({
                      open: true,
                      newMode,
                      onConfirm: () => {
                        store.getState().loadPage({
                          id: canvasConfig.id,
                          type: 'page' as const,
                          version: '1.0.0',
                          nodes: [],
                          config: { mode: newMode, width: canvasConfig.width, height: canvasConfig.height, theme: canvasConfig.theme as any },
                        });
                        setCanvasConfig(prev => ({ ...prev, mode: newMode }))
                        markDirty();
                      },
                    })
                    return true;
                  }}
                  onClearCanvas={() => { }}
                  onMarkDirty={markDirty}
                  onZoomReset={() => { setTimeout(() => { setZoom(80); setZoomInput("80") }, 50) }}
                />
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Keyboard Shortcuts Help Panel */}
      <ShortcutHelpPanel
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* 切换布局模式确认弹窗（替代原生 window.confirm） */}
      <Dialog
        open={confirmLayoutSwitch.open}
        onOpenChange={(open) => setConfirmLayoutSwitch(prev => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('alerts.switchLayoutTitle')}</DialogTitle>
            <DialogDescription>
              {t('alerts.switchLayoutConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLayoutSwitch(prev => ({ ...prev, open: false }))}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmLayoutSwitch.onConfirm()
                setConfirmLayoutSwitch(prev => ({ ...prev, open: false }))
              }}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <ProjectDialog
        open={showProjectDialog}
        onClose={() => {
          // 云端模式下，如果还没选择画布，不允许关闭对话框
          if (isAuthenticated && storageMode === 'cloud' && !hasSelectedDashboard) {
            return
          }
          setShowProjectDialog(false)
        }}
        onProjectLoad={(project) => {
          // 标记已选择画布
          setHasSelectedDashboard(true)

          // Persist last opened project id
          try {
            localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, project.meta.id)
          } catch { }

          // Load project into kernel store
          const pageData = {
            id: project.meta.id,
            type: 'page' as const,
            version: project.meta.version,
            nodes: project.nodes,
            config: {
              mode: project.canvas.mode,
              width: project.canvas.width,
              height: project.canvas.height,
            }
          }
          store.getState().loadPage(pageData)
          try {
            store.temporal.getState().clear?.()
          } catch { }
          // Update canvas config
          setCanvasConfig(prev => ({
            ...prev,
            id: project.meta.id,
            name: project.meta.name,
            createdAt: project.meta.createdAt,
            mode: project.canvas.mode,
            width: project.canvas.width,
            height: project.canvas.height,
            bgValue: project.canvas.background,
            gridCols: project.canvas.gridCols ?? prev.gridCols,
            gridRowHeight: project.canvas.gridRowHeight ?? prev.gridRowHeight,
            gridGap: project.canvas.gridGap ?? prev.gridGap,
            gridEnabled: project.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: project.canvas.gridSize ?? prev.gridSize,
            dataSources: (project.dataSources as any) ?? prev.dataSources,
            thumbnail: project.meta.thumbnail || "", // Load thumbnail from project meta
          }))

          // Restore data source connections from loaded project
          if (project.dataSources && Array.isArray(project.dataSources)) {
            for (const ds of project.dataSources as any[]) {
              try {
                dataSourceManager.registerDataSource(ds, false).catch(e => {
                  console.warn(`[Editor] Failed to restore data source ${ds.id}:`, e)
                })
              } catch (e) {
                console.warn(`[Editor] Failed to restore data source:`, e)
              }
            }
          }

          // 关闭对话框
          setShowProjectDialog(false)
        }}
        onNewProject={() => {
          // 本地模式下才使用这个方法创建新项目
          // 云端模式下会在 onProjectLoad 中处理
          setHasSelectedDashboard(true)

          // Create new empty project
          const newId = crypto.randomUUID()
          try {
            localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, newId)
          } catch { }
          const emptyPage = {
            id: newId,
            type: 'page' as const,
            version: '1.0.0',
            nodes: [],
            config: {
              mode: canvasConfig.mode,
              width: canvasConfig.width,
              height: canvasConfig.height,
            }
          }
          store.getState().loadPage(emptyPage)
          try {
            store.temporal.getState().clear?.()
          } catch { }

          setCanvasConfig(prev => ({
            ...prev,
            id: newId,
            name: 'My Visualization',
            createdAt: Date.now(),
            dataSources: [],
          }))

          // 关闭对话框
          setShowProjectDialog(false)
        }}
        currentProject={getProjectState()}
        language={language}
      />

    </div>
  )
})

export default Editor
