import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
  Moon,
  Sun,
  Eye,
  Upload,
  Search,
  Layers,
  Grid3x3,
  BarChart3,
  Box,
  Undo2,
  Redo2,
  Scan,
  PanelRightClose,
  PanelRightOpen,
  Maximize,
  Monitor,
  Menu,
  FolderOpen,
  Save,
  FileDown,
  FileUp,
  Settings,
  HelpCircle,
  Languages,
  Share2,
  Users,
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
  Minus,
  Plus,
  Database,
  LogOut,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type KernelState, type KernelActions } from '@thingsvis/kernel'
import type { PageSchemaType, NodeSchemaType } from '@thingsvis/schema'
import CanvasView from './CanvasView'
import { GridStackCanvas } from '@thingsvis/ui'
import ComponentsList from './LeftPanel/ComponentsList'
import LayerPanel from './LeftPanel/LayerPanel'
import PropsPanel from './RightPanel/PropsPanel'
import { SaveIndicator } from './SaveIndicator'
import { ShortcutHelpPanel } from './ShortcutHelpPanel'
import { ProjectDialog } from './ProjectDialog'
// Data source management moved to separate page: #/data-sources
import { loadPlugin } from '../plugins/pluginResolver'
import { extractDefaults } from '../plugins/schemaUtils'
import { store } from '../lib/store'
import { useAutoSave } from '../hooks/useAutoSave'
import { useHistoryState } from '../hooks/useHistoryState'
import { useStorage } from '../hooks/useStorage'
import { projectStorage } from '../lib/storage/projectStorage'
import type { ProjectFile } from '../lib/storage/schemas'
import { recentProjects } from '../lib/storage/recentProjects'
import { createCloudStorageAdapter } from '../lib/storage/adapter'
import { STORAGE_CONSTANTS } from '../lib/storage/constants'
import { commandRegistry, useKeyboardShortcuts, registerDefaultCommands } from '../lib/commands'
import { pickImage, ImageFileTooLargeError, openImagePicker } from './tools/imagePicker'
import { isEmbedMode, on as onEmbedEvent, requestSave, getInitialData, getEditMode } from '../embed/embed-mode'
import { processEmbedInitPayload, initEmbedModeFromUrl, type EmbedInitPayload } from '../embed/embed-init'
import { initSaveStrategy, updateEmbeddedConfig, getEffectiveProjectId } from '../lib/storage/saveStrategy'
import { uploadFile } from "@/lib/api/uploads"
import { uploadImage as uploadToLocal } from "@/lib/imageUpload"

// Generate UUID helper
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

type Tool = "select" | "rectangle" | "circle" | "line" | "text" | "image" | "pan"
type Language = "zh" | "en"

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
  theme: "dark" | "light" | "auto"
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

export default function Editor() {
  const { isAuthenticated, user, logout, isLoading: authLoading, storageMode } = useAuth()
  const { currentProject } = useProject()
  const [activeTool, setActiveTool] = useState<Tool>("select")
  // Initialize dark mode state from html class
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [leftPanelTab, setLeftPanelTab] = useState<"components" | "layers">("components")
  // Data source dialog removed - now uses separate page
  const [searchQuery, setSearchQuery] = useState("")
  const [language, setLanguage] = useState<Language>("zh")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  // 跟踪云端模式下是否已选择画布（用于阻止用户在未选择画布时关闭对话框）
  const [hasSelectedDashboard, setHasSelectedDashboard] = useState(false)
  // Image picker state for image tool (stores Object URL)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>(undefined)

  const handleLogout = useCallback(() => {
    logout()
    window.location.hash = '#/'
  }, [logout])

  // Embed mode UI visibility from URL params
  const embedVisibility = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const isEmbedded = params.get('mode') === 'embedded'
    return {
      isEmbedded,
      showLibrary: params.get('showLibrary') !== '0',
      showProps: params.get('showProps') !== '0',
      showTopLeft: params.get('showTopLeft') !== '0',
      showToolbar: params.get('showToolbar') !== '0',
      showTopRight: params.get('showTopRight') !== '0',
    }
  }, [])

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
      console.log('[Editor] 初始化嵌入模式 SaveStrategy');
      initEmbedModeFromUrl(isAuthenticated);
    }
  }, [embedVisibility.isEmbedded, isAuthenticated])

  // Debug: Log authentication state
  useEffect(() => {

  }, [isAuthenticated, authLoading, user])

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

  const [zoom, setZoom] = useState(100)
  const [zoomInput, setZoomInput] = useState("100")
  const [showRightPanel, setShowRightPanel] = useState(true)

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

  // Resolve initial project id from URL/hash, last-opened id, or recents.
  const resolveInitialProjectId = (): string => {
    // 1) URL hash query: #/editor?projectId=...
    try {
      const hash = window.location.hash || ''
      const qIndex = hash.indexOf('?')
      if (qIndex >= 0) {
        const params = new URLSearchParams(hash.slice(qIndex + 1))
        const fromHash = params.get('projectId')
        if (fromHash) return fromHash
      }
    } catch { }

    // 2) localStorage last opened project
    try {
      const last = localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY)
      if (last) return last
    } catch { }

    // 3) first recent project
    const recent = recentProjects.get()[0]?.id
    if (recent) return recent

    // 4) new
    return crypto.randomUUID()
  }

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfigSchema>(() => {
    const initialId = resolveInitialProjectId()
    // 🆕 embed 模式默认使用 grid 布局
    const defaultMode = isEmbedMode() ? "grid" : "fixed"
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
      theme: "dark" as "dark" | "light" | "auto",
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
    // Extract node schemas from NodeState (schemaRef contains the actual node data)
    const nodes = Object.values(state.nodesById).map(nodeState => nodeState.schemaRef)

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
      dataSources: canvasConfig.dataSources,
    }
  }, [projectId, canvasConfig])

  // Helper to identify Widget Mode
  const isWidgetMode = isEmbedMode() && (projectId === 'widget' || projectId.startsWith('embed-'));

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
            // 🛑 Hotfix: Embed Mode handling
            // If we are in embed mode and the project ID is assigned by Host (e.g. 'widget' or 'embed-*'),
            // it means the project data comes from postMessage, NOT from the cloud.
            // Fetching from cloud will return 404 and cause fallback to empty project, wiping out our init data.
            const isHostProject = isEmbedMode() && (projectId === 'widget' || projectId.startsWith('embed-'));

            if (isHostProject) {
              console.log('[Editor] Bootstrap: Host-managed project (Widget Mode), skipping cloud load.');
              // Data is already loaded via onEmbedInit. 
              // We must stop bootstrapping here to prevent 'loaded=null' from triggering the empty project fallback.
              bootstrappingRef.current = false;
              setIsBootstrapping(false);
              return;
            } else {
              console.log('[Editor] Bootstrap: 从云端加载项目', projectId);
              const cloudProject = await storage.get(projectId);
              console.log('[Editor] Bootstrap: 云端项目结果:', cloudProject);
              if (cloudProject) {
                loaded = {
                  meta: {
                    version: '1.0.0',
                    id: cloudProject.meta.id,
                    name: cloudProject.meta.name,
                    createdAt: cloudProject.meta.createdAt,
                    updatedAt: cloudProject.meta.updatedAt,
                  },
                  canvas: cloudProject.schema.canvas,
                  nodes: cloudProject.schema.nodes,
                  dataSources: cloudProject.schema.dataSources,
                };
              }
            }
          } else {
            console.log('[Editor] Bootstrap: 从本地加载项目', projectId);
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
                height: loaded.canvas.height
              }
            })
            // Update canvas config
            setCanvasConfig(prev => ({
              ...prev,
              id: loaded.meta.id,
              name: loaded.meta.name,
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
    canvasConfig.gridSize,
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

    const unsubscribe = store.subscribe(() => {
      if (bootstrappingRef.current) return

      const currentState = store.getState()
      const nodesById = currentState.nodesById
      const layerOrder = currentState.layerOrder

      // 比较引用是否变化（zustand 在状态变化时会创建新引用）
      if (nodesById !== prevNodesById || layerOrder !== prevLayerOrder) {
        prevNodesById = nodesById
        prevLayerOrder = layerOrder
        markDirty()
      }
    })

    return unsubscribe
  }, [isBootstrapping, markDirty])

  const openPreview = useCallback(async () => {
    // Ensure preview loads the latest saved content
    await saveNow()

    if (isEmbedMode()) {
      window.parent.postMessage({ type: 'thingsvis:preview', projectId }, '*')
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

    if (isEmbedMode()) {
      // In embed mode, notify the host to handle publish
      window.parent.postMessage({ type: 'thingsvis:publish', projectId }, '*')
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
        console.log('[Editor] Dashboard published successfully')
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

  // Handle embed mode triggerSave event
  useEffect(() => {
    if (!isEmbedMode()) return;

    const unsubscribe = onEmbedEvent('triggerSave', () => {
      console.log('[Editor triggerSave] 📦 开始收集保存数据...');

      // Collect all nodes with their thing model bindings
      const state = store.getState() as KernelState;
      console.log('[Editor triggerSave] Store state nodesById count:', Object.keys(state.nodesById).length);

      const nodes = Object.values(state.nodesById).map(nodeState => {
        const schema = nodeState.schemaRef as any;
        // Debug log for each node's grid property
        console.log(`[Editor triggerSave] Node ${schema.id} grid:`, JSON.stringify(schema.grid));
        return {
          id: schema.id,
          type: schema.type,
          position: schema.position,
          size: schema.size,
          props: schema.props,
          // Include grid position for grid layout mode
          grid: schema.grid,
          // Include thing model bindings if present
          thingModelBindings: schema.thingModelBindings || [],
        };
      });

      console.log('[Editor triggerSave] 📊 Collected nodes:', nodes.map(n => ({ id: n.id, grid: n.grid })));

      // Build export data for ThingsPanel
      const exportData = {
        canvas: {
          mode: canvasConfig.mode,
          width: canvasConfig.width,
          height: canvasConfig.height,
          background: canvasConfig.bgValue,
          fullWidthPreview: canvasConfig.fullWidthPreview ?? false,
        },
        nodes,
        // Collect all thing model bindings in flat format for easy access
        dataBindings: nodes.flatMap(node =>
          (node.thingModelBindings || []).map((binding: any) => ({
            nodeId: node.id,
            targetProp: binding.targetProp,
            metricsId: binding.metricsId,
            metricsName: binding.metricsName,
            metricsType: binding.metricsType,
            dataType: binding.dataType,
            unit: binding.unit,
          }))
        ),
      };


      // Send to host
      requestSave(exportData);
    });

    return unsubscribe;
  }, [canvasConfig]);

  // Handle embed mode init event - load initial data from host
  useEffect(() => {
    if (!isEmbedMode()) return;

    const unsubscribe = onEmbedEvent('init', async (payload: EmbedInitPayload) => {
      console.log('[Editor] 📥 收到 embed init 事件:', payload);

      // 使用新的处理函数解析数据
      const processed = processEmbedInitPayload(payload);
      if (!processed) {
        console.warn('[Editor] ⚠️ embed init 数据无效');
        return;
      }

      // 🔑 关键修复：使用宿主传来的项目 ID 更新 canvasConfig
      setCanvasConfig(prev => ({
        ...prev,
        id: processed.projectId, // 使用宿主传来的 ID
        name: processed.projectName,
        mode: processed.canvas.mode as any,
        width: processed.canvas.width,
        height: processed.canvas.height,
        bgValue: processed.canvas.background,
        gridCols: processed.canvas.gridCols,
        gridRowHeight: processed.canvas.gridRowHeight,
        gridGap: processed.canvas.gridGap,
        fullWidthPreview: processed.canvas.fullWidthPreview,
      }));

      // 🔑 监听 updateData 事件 (用于 Widget 模式实时数据推送)
      const dataUnsubscribe = onEmbedEvent('updateData', (payload: any) => {
        // console.log('[Editor] 收到 updateData:', payload);
        const data = payload || {};

        // 遍历所有节点，检查是否有物模型绑定
        const state = store.getState();
        Object.values(state.nodesById).forEach(nodeState => {
          const schema = nodeState.schemaRef as any;
          const bindings = schema.thingModelBindings || [];

          if (bindings.length > 0) {
            // 有绑定，尝试更新属性
            const newProps = { ...schema.props };
            let changed = false;

            bindings.forEach((binding: any) => {
              // 绑定的目标属性 (例如 'value', 'data')
              const targetProp = binding.targetProp;
              // 数据源字段 ID (例如 'temperature', 'humidity')
              const fieldId = binding.metricsId || binding.key;

              if (targetProp && fieldId && data[fieldId] !== undefined) {
                newProps[targetProp] = data[fieldId];
                changed = true;
              }
            });

            if (changed) {
              // 更新节点属性
              store.getState().updateNode(schema.id, { props: newProps });
            }
          }
        });
      });

      // 🔑 saveTarget='self' 时，从 ThingsVis 云端获取节点（包含 data 绑定字段）
      let nodesToLoad = processed.nodes;
      if (processed.saveTarget === 'self' && processed.projectId) {
        console.log('[Editor] 📥 saveTarget=self，从云端获取节点数据（包含 data 绑定）');
        try {
          const cloudAdapter = createCloudStorageAdapter();
          const cloudProject = await cloudAdapter.get(processed.projectId);
          if (cloudProject && cloudProject.schema.nodes.length > 0) {
            console.log('[Editor] ✅ 云端节点已获取，节点数:', cloudProject.schema.nodes.length);
            console.log('[Editor] 云端节点 data 字段:', cloudProject.schema.nodes.map((n: any) => ({
              id: n.id,
              type: n.type,
              hasData: !!n.data,
              data: n.data
            })));
            nodesToLoad = cloudProject.schema.nodes;
          } else {
            console.log('[Editor] ⚠️ 云端无节点数据，使用宿主传来的节点');
          }
        } catch (err) {
          console.warn('[Editor] ⚠️ 获取云端节点失败，使用宿主传来的节点:', err);
        }
      }

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

      console.log('[Editor] ✅ embed init 处理完成, projectId:', processed.projectId);
    });

    // Also check if initial data is already available (in case init was received before this effect ran)
    const initialData = getInitialData() as EmbedInitPayload | null;
    if (initialData) {
      (async () => {
        console.log('[Editor] 📥 发现已有初始数据，处理中...');
        const processed = processEmbedInitPayload(initialData);
        if (processed) {
          // 🔍 DEBUG LOGS
          console.group('[Editor] 处理 Init Payload');
          console.log('Processed Canvas:', processed.canvas);
          console.log('Nodes count:', processed.nodes.length);
          console.groupEnd();

          setCanvasConfig(prev => ({
            ...prev,
            id: processed.projectId,
            name: processed.projectName,
            mode: processed.canvas.mode as any,
            width: processed.canvas.width,
            height: processed.canvas.height,
            bgValue: processed.canvas.background,
            gridCols: processed.canvas.gridCols,
            gridRowHeight: processed.canvas.gridRowHeight,
            gridGap: processed.canvas.gridGap,
            fullWidthPreview: processed.canvas.fullWidthPreview,
          }));

          // 🔑 saveTarget='self' 时，从 ThingsVis 云端获取节点（包含 data 绑定字段）
          let nodesToLoad = processed.nodes;
          if (processed.saveTarget === 'self' && processed.projectId) {
            console.log('[Editor] 📥 saveTarget=self，从云端获取节点数据（包含 data 绑定）');
            try {
              const cloudAdapter = createCloudStorageAdapter();
              const cloudProject = await cloudAdapter.get(processed.projectId);
              if (cloudProject && cloudProject.schema.nodes.length > 0) {
                console.log('[Editor] ✅ 云端节点已获取，节点数:', cloudProject.schema.nodes.length);
                nodesToLoad = cloudProject.schema.nodes;
              }
            } catch (err) {
              console.warn('[Editor] ⚠️ 获取云端节点失败，使用宿主传来的节点:', err);
            }
          }

          if (nodesToLoad.length > 0) {
            store.getState().loadPage({
              id: processed.projectId,
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

            try {
              store.temporal.getState().clear?.();
            } catch { }
          }
        }
      })();
    }

    return unsubscribe
  }, [])

  // 🆕 监听 Host 主动触发的保存请求 (Widget Mode)
  useEffect(() => {
    if (!isWidgetMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'thingsvis:request-save') {
        console.log('[Editor] 收到请求保存指令，手动发送数据');

        // 由于 AutoSave 被禁用，saveNow() 可能不执行，故手动构建数据发送
        const state = getProjectState();
        const payload = {
          config: {
            meta: state.meta,
            canvas: state.canvas,
            nodes: state.nodes,
            dataSources: state.dataSources
          }
        };

        window.parent.postMessage({
          type: 'thingsvis:host-save',
          payload
        }, '*');

        console.log('[Editor] 已发送 thingsvis:host-save', payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isWidgetMode, getProjectState]);

  // 🆕 在 bootstrapping 完成后发送握手请求
  useEffect(() => {
    if (!isEmbedMode()) return
    if (bootstrappingRef.current) return // 还在加载中
    if (isBootstrapping) return

    console.log('🆕 [Editor] Bootstrapping 完成，发送握手请求')
    if (window.parent && window.parent !== window) {
      // 发送 ready 消息
      window.parent.postMessage({ type: 'thingsvis:ready' }, '*')
      console.log('✅ [Editor] 已发送 thingsvis:ready')

      // 主动请求初始数据
      setTimeout(() => {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'thingsvis:request-init-data' }, '*')
          console.log('📨 [Editor] 已发送 thingsvis:request-init-data (延迟100ms)')
        }
      }, 100) // 轻微延迟确保 ready 消息先到达
    }
  }, [isBootstrapping])

  useEffect(() => {
    // Sync canvas state to kernel store when config changes
    store.getState().updateCanvas({
      mode: canvasConfig.mode,
      width: canvasConfig.width,
      height: canvasConfig.height
    })
  }, [canvasConfig.mode, canvasConfig.width, canvasConfig.height])

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
      const { entry } = await loadPlugin(componentType)
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
        alert(language === 'zh' ? '图片文件过大，请选择小于 10MB 的图片' : 'Image file is too large. Please select an image smaller than 10MB.')
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
      alert(language === 'zh' ? '图片上传失败' : 'Image upload failed')
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
    { id: "text" as Tool, icon: Type, label: "文本" },
    { id: "image" as Tool, icon: ImageIcon, label: "图片" },
    { id: "pan" as Tool, icon: Hand, label: "移动" },
  ]

  const shortcuts = [
    { key: "Ctrl/⌘ + O", action: language === "zh" ? "打开项目" : "Open Project" },
    { key: "Ctrl/⌘ + S", action: language === "zh" ? "保存项目" : "Save Project" },
    { key: "Ctrl/⌘ + Z", action: language === "zh" ? "撤销" : "Undo" },
    { key: "Ctrl/⌘ + Shift + Z", action: language === "zh" ? "重做" : "Redo" },
    { key: "V", action: language === "zh" ? "选择工具" : "Select Tool" },
    { key: "R", action: language === "zh" ? "矩形工具" : "Rectangle Tool" },
    { key: "O", action: language === "zh" ? "圆形工具" : "Circle Tool" },
    { key: "T", action: language === "zh" ? "文本工具" : "Text Tool" },
    { key: "H", action: language === "zh" ? "移动画布" : "Pan Canvas" },
    { key: "Delete", action: language === "zh" ? "删除选中" : "Delete Selected" },
    { key: "Ctrl/⌘ + D", action: language === "zh" ? "复制" : "Duplicate" },
    { key: "Ctrl/⌘ + G", action: language === "zh" ? "成组" : "Group" },
    { key: "?", action: language === "zh" ? "快捷键帮助" : "Keyboard Shortcuts" },
  ]

  const resolvePlugin = useCallback(async (type: string) => {
    const { entry } = await loadPlugin(type);
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
            resolvePlugin={resolvePlugin}
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
                const { entry } = await loadPlugin(componentType);
                const defaultProps = extractDefaults(entry.schema);
                const now = Date.now();
                const node = {
                  id: `node-${componentType}-${now}`,
                  type: componentType,
                  position: { x: 100, y: 100 },
                  size: { width: 200, height: 80 },
                  props: defaultProps,
                  grid: gridPosition,
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
            resolvePlugin={resolvePlugin}
            zoom={zoom / 100}
            onZoomChange={(newZoom) => setZoom(Math.round(newZoom * 100))}
            onUserEdit={markDirty}
            onResetTool={handleResetTool}
            pendingImageUrl={pendingImageUrl}
            onImagePickerRequest={handleImagePickerRequest}
            onImagePickerComplete={handleImagePickerComplete}
          />
        )}
      </div>

      {isBootstrapping && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center space-y-6 pointer-events-auto">
            <h2 className="text-3xl font-bold text-foreground">ThingsVis</h2>
            <p className="text-muted-foreground max-w-md">
              {language === "zh" ? "正在加载..." : "Loading..."}
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className={`absolute ${isEmbedMode() ? 'top-4' : 'top-4'} left-4 right-4 z-50 flex items-center justify-between pointer-events-none`}>
        {/* Left Side: Logo (Menu), Title, Status */}
        <div className={`glass rounded-md shadow-md border border-border flex items-center gap-4 px-4 py-2 pointer-events-auto ${!embedVisibility.showTopLeft ? 'invisible' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-md bg-[#6965db] hover:bg-[#5851db] flex items-center justify-center">
                  <Menu className="h-4 w-4 text-white" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 mt-2">
              <DropdownMenuItem className="gap-2" onClick={() => setShowProjectDialog(true)}>
                <FolderOpen className="h-4 w-4" />
                {language === "zh" ? "打开项目" : "Open Project"}
                <span className="ml-auto text-sm text-muted-foreground">Ctrl+O</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => saveNow()}>
                <Save className="h-4 w-4" />
                {language === "zh" ? "保存" : "Save"}
                <span className="ml-auto text-sm text-muted-foreground">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => window.open('#/data-sources', '_blank')}>
                <Database className="h-4 w-4" />
                {language === "zh" ? "数据源管理" : "Data Sources"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <FileUp className="h-4 w-4" />
                {language === "zh" ? "导入配置" : "Import Config"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <FileDown className="h-4 w-4" />
                {language === "zh" ? "导出配置" : "Export Config"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Settings className="h-4 w-4" />
                {language === "zh" ? "设置" : "Settings"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <HelpCircle className="h-4 w-4" />
                {language === "zh" ? "帮助" : "Help"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!authLoading && isAuthenticated && user ? (
                <>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{user.name || user.email}</div>
                    <div className="text-xs">{user.email}</div>
                  </div>
                  <DropdownMenuItem
                    className="gap-2 text-red-600 dark:text-red-400"
                    onClick={() => {
                      logout()
                      window.location.hash = '#/'
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {language === "zh" ? "退出登录" : "Logout"}
                  </DropdownMenuItem>
                </>
              ) : !authLoading ? (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => window.location.hash = '#/login'}
                >
                  <Users className="h-4 w-4" />
                  {language === "zh" ? "登录" : "Login"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            placeholder="未命名项目"
            className="min-w-[50px] max-w-[300px] w-auto h-8 bg-transparent border-0 focus-visible:ring-0 px-2 text-foreground font-medium"
            value={canvasConfig.name}
            onChange={(e) => setCanvasConfig({ ...canvasConfig, name: e.target.value })}
            style={{ width: `${Math.max(100, Math.min(150, (canvasConfig.name?.length || 6) * 14 + 16))}px` }}
          />

          <SaveIndicator
            status={saveState.status}
            lastSavedAt={saveState.lastSavedAt}
            error={saveState.error}
            language={language}
            className="ml-1 pr-2"
          />
        </div>

        {/* Center Side: Tools */}
        <div className={`glass rounded-md shadow-md border border-border flex items-center gap-1 px-2 py-1.5 pointer-events-auto ${!embedVisibility.showToolbar ? 'invisible' : ''}`}>
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id

            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-md transition-all focus:ring-0 focus:outline-none ${isActive
                  ? "bg-[#6965db]/10 text-[#6965db] shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              </Button>
            )
          })}
        </div>

        {/* Right Side: Language, Theme, Preview, Publish */}
        <div className={`glass rounded-md shadow-md border border-border flex items-center gap-2 px-3 py-2 pointer-events-auto ${!embedVisibility.showTopRight ? 'invisible' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md focus:ring-0 focus:outline-none">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2">
              <DropdownMenuItem onClick={() => setLanguage("zh")}>
                <span className={language === "zh" ? "font-semibold" : ""}>中文</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                <span className={language === "en" ? "font-semibold" : ""}>English</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md focus:ring-0 focus:outline-none" onClick={toggleTheme}>
            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {!showRightPanel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md focus:ring-0 focus:outline-none"
              onClick={() => setShowRightPanel(true)}
              title={language === "zh" ? "显示属性面板" : "Show Properties"}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-md px-4 hover:bg-accent focus:ring-0 focus:outline-none"
            onClick={() => saveNow()}
            disabled={saveState.status === 'saving'}
          >
            <Save className="h-4 w-4" />
            <span className="text-sm font-medium">{language === "zh" ? "保存" : "Save"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-md px-4 hover:bg-accent focus:ring-0 focus:outline-none"
            onClick={openPreview}
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">{language === "zh" ? "预览" : "Preview"}</span>
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-md bg-[#6965db] hover:bg-[#5851db] text-white px-4 shadow-md shadow-[#6965db]/20 focus:ring-0 focus:outline-none transition-all"
            onClick={openPublish}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{language === "zh" ? "发布" : "Publish"}</span>
          </Button>
        </div>
      </div>

      {/* Left Panel: Assets & Layers */}
      {embedVisibility.showLibrary && (
        <aside className={`absolute left-4 ${isEmbedMode()
          ? (embedVisibility.showTopLeft || embedVisibility.showTopRight)
            ? 'top-20' // 顶部工具栏显示时留出空间
            : 'top-4'
          : 'top-20'
          } bottom-4 z-40 w-72`}>
          <div className="glass rounded-md shadow-xl border border-border h-full flex flex-col overflow-hidden">
            <div className="flex border-b border-border">
              <button
                onClick={() => setLeftPanelTab("components")}
                className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition-colors border-b-2 ${leftPanelTab === "components"
                  ? "text-foreground border-[#6965db] -mb-px"
                  : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
              >
                <Grid3x3 className="h-4 w-4" />
                {language === "zh" ? "组件库" : "Library"}
              </button>
              <button
                onClick={() => setLeftPanelTab("layers")}
                className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition-colors border-b-2 ${leftPanelTab === "layers"
                  ? "text-foreground border-[#6965db] -mb-px"
                  : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
              >
                <Layers className="h-4 w-4" />
                {language === "zh" ? "图层" : "Layers"}
              </button>
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

      {/* Bottom Left Controls: Zoom & Undo/Redo */}
      <div className={`absolute bottom-4 z-40 flex items-center gap-3 select-none ${embedVisibility.showLibrary ? 'left-[324px]' : 'left-4'}`}>
        {/* Zoom Controls */}
        <div className="glass rounded-md shadow-md border border-border flex items-center p-1.5 bg-[#f0f0f7]/50 dark:bg-[#1a1a24]/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
            onClick={() => setZoom(Math.max(10, zoom - 10))}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="w-[48px] px-0.5">
            <Input
              value={zoomInput + "%"}
              onChange={(e) => {
                // Allow user to type, stripping % for state
                const val = e.target.value.replace(/%/g, '')
                setZoomInput(val)
              }}
              onBlur={handleZoomInputBlur}
              onKeyDown={handleZoomInputKeyDown}
              className="h-6 text-sm font-medium text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:bg-background/50 p-0 tabular-nums shadow-none hover:bg-background/40 transition-colors rounded-sm"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
            onClick={() => setZoom(Math.min(500, zoom + 10))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
            title={language === "zh" ? "适应窗口" : "Best Fit"}
            onClick={() => {
              const leftPanelWidth = embedVisibility.showLibrary ? 320 : 0
              const rightPanelWidth = (embedVisibility.showProps && showRightPanel) ? 340 : 0
              const availableWidth = window.innerWidth - leftPanelWidth - rightPanelWidth - 60
              const availableHeight = window.innerHeight - 150

              const canvasW = canvasConfig.width || 1920
              const canvasH = canvasConfig.height || 1080

              const scaleW = availableWidth / canvasW
              const scaleH = availableHeight / canvasH

              const bestFit = Math.min(scaleW, scaleH)
              setZoom(Math.floor(Math.max(10, Math.min(500, bestFit * 90))))
            }}
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
            title={language === "zh" ? "100% 视图" : "100% View"}
            onClick={() => setZoom(100)}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="glass rounded-md shadow-md border border-border flex items-center p-1.5 gap-1 bg-[#f0f0f7]/50 dark:bg-[#1a1a24]/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 disabled:opacity-30 focus:ring-0 focus:outline-none"
            disabled={!canUndo}
            onClick={handleUndo}
            title={language === "zh" ? "撤销" : "Undo"}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 disabled:opacity-30 focus:ring-0 focus:outline-none"
            disabled={!canRedo}
            onClick={handleRedo}
            title={language === "zh" ? "重做" : "Redo"}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Right: Help Button (Floating) */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full shadow-lg border border-border bg-[#f0f0f7]/90 dark:bg-[#1a1a24]/90 hover:bg-background text-muted-foreground hover:text-foreground transition-all"
          onClick={() => setShowShortcuts(true)}
          title={language === "zh" ? "快捷键帮助 (?)" : "Shortcuts (?)"}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Panel - Properties */}
      {embedVisibility.showProps && showRightPanel && (
        <aside className={`absolute right-4 ${isEmbedMode()
          ? (embedVisibility.showTopLeft || embedVisibility.showTopRight)
            ? 'top-20' // 顶部工具栏显示时留出空间
            : 'top-4'
          : 'top-20'
          } bottom-4 w-80 z-40`}>
          <div className="glass rounded-md shadow-xl border border-border h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">{language === "zh" ? "属性" : "Properties"}</h2>
              <button
                className="p-1 hover:bg-accent rounded"
                onClick={() => {
                  if (selectedElement) {
                    store.getState().selectNode(null)
                  } else {
                    setShowRightPanel(false)
                  }
                }}
              >
                <X className="h-4 w-4" />
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
                <>
                  {/* Canvas Settings */}
                  <div className="space-y-4 pb-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">
                      {language === "zh" ? "基础信息" : "Basic Info"}
                    </h3>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">{language === "zh" ? "项目名称" : "Project Name"}</label>
                      <Input
                        value={currentProject?.name || (language === "zh" ? "未命名项目" : "Untitled Project")}
                        readOnly
                        disabled
                        className="h-8 text-sm rounded-md bg-muted/50 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">{language === "zh" ? "页面名称" : "Page Name"}</label>
                      <Input
                        value={canvasConfig.name}
                        onChange={(e) => setCanvasConfig({ ...canvasConfig, name: e.target.value })}
                        className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">{language === "zh" ? "页面ID" : "Page ID"}</label>
                      <Input
                        value={canvasConfig.id}
                        readOnly
                        className="h-8 text-sm rounded-md bg-muted focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">{language === "zh" ? "缩略图" : "Thumbnail"}</label>
                      <div className="flex items-center gap-2">
                        {canvasConfig.thumbnail ? (
                          <div className="relative group w-full">
                            <img
                              src={canvasConfig.thumbnail}
                              alt="Thumbnail"
                              className="w-full h-20 object-cover rounded-md border border-border"
                            />
                            <button
                              onClick={() => setCanvasConfig({ ...canvasConfig, thumbnail: undefined })}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="flex-1 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-[#6965db] transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const base64 = ev.target?.result as string;
                                    setCanvasConfig({ ...canvasConfig, thumbnail: base64 });
                                    markDirty();
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {language === "zh" ? "点击上传缩略图" : "Click to upload"}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pb-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">
                      {language === "zh" ? "画布配置" : "Canvas Config"}
                    </h3>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">{language === "zh" ? "布局模式" : "Layout Mode"}</label>
                      <select
                        value={canvasConfig.mode}
                        onChange={(e) => {
                          const newMode = e.target.value as "fixed" | "infinite" | "grid";
                          if (newMode !== canvasConfig.mode) {
                            const hasNodes = Object.keys(store.getState().nodesById).length > 0;
                            // 嵌入模式下跳过 confirm 对话框（iframe 中 confirm 可能被阻止）
                            const shouldProceed = isEmbedMode() ? true : !hasNodes || window.confirm(
                              language === "zh"
                                ? "切换布局模式将清空当前画布，是否继续？"
                                : "Switching layout mode will clear the current canvas. Continue?"
                            );
                            if (!shouldProceed) return;
                            if (hasNodes) {
                              store.getState().loadPage({
                                id: canvasConfig.id,
                                type: 'page' as const,
                                version: '1.0.0',
                                nodes: [],
                                config: {
                                  mode: newMode,
                                  width: canvasConfig.width,
                                  height: canvasConfig.height,
                                },
                              });
                              markDirty();
                            }
                            setCanvasConfig({ ...canvasConfig, mode: newMode });
                          }
                        }}
                        className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none"
                      >
                        <option value="grid">{language === "zh" ? "栅格布局" : "Grid Layout"}</option>
                        <option value="fixed">{language === "zh" ? "固定尺寸" : "Fixed Size"}</option>
                        <option value="infinite">{language === "zh" ? "无限画布" : "Infinite Canvas"}</option>
                      </select>
                    </div>

                    {canvasConfig.mode === 'grid' ? (
                      <div className="space-y-3">
                        {/* Canvas size for grid mode */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "宽度" : "Width"}</label>
                            <Input
                              type="number"
                              value={canvasConfig.width}
                              onChange={(e) => setCanvasConfig({ ...canvasConfig, width: Number(e.target.value) })}
                              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "高度" : "Height"}</label>
                            <Input
                              type="number"
                              value={canvasConfig.height}
                              onChange={(e) => setCanvasConfig({ ...canvasConfig, height: Number(e.target.value) })}
                              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                          </div>
                        </div>
                        {/* Grid settings */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "列数" : "Cols"}</label>
                            <Input
                              type="number"
                              value={canvasConfig.gridCols ?? 24}
                              min={1}
                              max={48}
                              onChange={(e) => setCanvasConfig({ ...canvasConfig, gridCols: Number(e.target.value) })}
                              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "行高" : "Row H"}</label>
                            <Input
                              type="number"
                              value={canvasConfig.gridRowHeight ?? 10}
                              min={5}
                              max={200}
                              onChange={(e) => setCanvasConfig({ ...canvasConfig, gridRowHeight: Number(e.target.value) })}
                              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "间距" : "Gap"}</label>
                            <Input
                              type="number"
                              value={canvasConfig.gridGap ?? 5}
                              min={0}
                              max={50}
                              onChange={(e) => setCanvasConfig({ ...canvasConfig, gridGap: Number(e.target.value) })}
                              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === "zh" ? "栅格布局模式下，组件自动吸附到网格" : "In grid layout mode, widgets snap to grid"}
                        </p>
                        {/* 屏幕自适应选项 */}
                        <div className="flex items-center justify-between pt-2">
                          <label className="text-sm font-medium">
                            {language === "zh" ? "屏幕自适应" : "Full Width Preview"}
                          </label>
                          <input
                            type="checkbox"
                            checked={canvasConfig.fullWidthPreview ?? false}
                            onChange={(e) => setCanvasConfig({
                              ...canvasConfig,
                              fullWidthPreview: e.target.checked
                            })}
                            className="h-4 w-4 rounded border-gray-300 accent-[#6965db]"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === "zh"
                            ? "勾选后预览页面画布撑满容器宽度，无背景阴影"
                            : "When checked, preview canvas fills container width without shadow"}
                        </p>
                      </div>
                    ) : canvasConfig.mode === 'fixed' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{language === "zh" ? "宽度" : "Width"}</label>
                          <Input
                            type="number"
                            value={canvasConfig.width}
                            onChange={(e) => setCanvasConfig({ ...canvasConfig, width: Number(e.target.value) })}
                            className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{language === "zh" ? "高度" : "Height"}</label>
                          <Input
                            type="number"
                            value={canvasConfig.height}
                            onChange={(e) => setCanvasConfig({ ...canvasConfig, height: Number(e.target.value) })}
                            className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Keyboard Shortcuts Help Panel */}
      <ShortcutHelpPanel
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        language={language}
      />

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
          }))

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
}

