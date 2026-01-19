import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
import { projectStorage } from '../lib/storage/projectStorage'
import type { ProjectFile } from '../lib/storage/schemas'
import { recentProjects } from '../lib/storage/recentProjects'
import { STORAGE_CONSTANTS } from '../lib/storage/constants'
import { commandRegistry, useKeyboardShortcuts, registerDefaultCommands } from '../lib/commands'
import { pickImage, ImageFileTooLargeError } from './tools/imagePicker'
import { isEmbedMode, on as onEmbedEvent, requestSave, getInitialData, getEditMode } from '../embed/embed-mode'

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
  mode: "fixed" | "infinite" | "reflow" | "grid"
  width: number
  height: number
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
  const [activeTool, setActiveTool] = useState<Tool>("select")
  // Initialize dark mode state from html class
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [leftPanelTab, setLeftPanelTab] = useState<"components" | "layers">("components")
  // Data source dialog removed - now uses separate page
  const [searchQuery, setSearchQuery] = useState("")
  const [language, setLanguage] = useState<Language>("zh")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProjectDialog, setShowProjectDialog] = useState(false)
  // Image picker state for image tool (stores Object URL)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>(undefined)

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

  const [zoom, setZoom] = useState(100)

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
    } catch {}

    // 2) localStorage last opened project
    try {
      const last = localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY)
      if (last) return last
    } catch {}

    // 3) first recent project
    const recent = recentProjects.get()[0]?.id
    if (recent) return recent

    // 4) new
    return crypto.randomUUID()
  }

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfigSchema>(() => {
    const initialId = resolveInitialProjectId()
    const defaultMode = isEmbedMode() ? "reflow" : "fixed"
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
    mode: defaultMode as "fixed" | "infinite" | "reflow",
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
        createdAt: canvasConfig.createdAt,
        updatedAt: Date.now(),
      },
      canvas: {
        mode: canvasConfig.mode,
        width: canvasConfig.width,
        height: canvasConfig.height,
        background: canvasConfig.bgValue,
        gridEnabled: canvasConfig.gridEnabled,
        gridSize: canvasConfig.gridSize,
      },
      nodes: nodes,
      dataSources: canvasConfig.dataSources,
    }
  }, [projectId, canvasConfig])

  // Auto-save hook
  const { saveState, markDirty, saveNow } = useAutoSave({
    projectId,
    getProjectState,
    enabled: !isBootstrapping,
  })

  // Bootstrap: load last project into store (or create a new empty page)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      bootstrappingRef.current = true
      setIsBootstrapping(true)

      try {
        const loaded = await projectStorage.load(projectId)
        if (cancelled) return
        if (loaded) {
          // Load project into kernel store
          store.getState().loadPage({
            id: loaded.meta.id,
            type: 'page' as const,
            version: loaded.meta.version,
            nodes: loaded.nodes,
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
            gridEnabled: loaded.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: loaded.canvas.gridSize ?? prev.gridSize,
            dataSources: (loaded.dataSources as any) ?? prev.dataSources,
          }))

          // Clear undo history when switching/loading projects (best-effort)
          try {
            store.temporal.getState().clear?.()
          } catch {}
        } else {
          // Create new empty project page
          store.getState().loadPage({
            id: projectId,
            type: 'page' as const,
            version: '1.0.0',
            nodes: [],
          })
          try {
            store.temporal.getState().clear?.()
          } catch {}
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[Editor] bootstrap project failed', e)
      } finally {
        if (cancelled) return
        bootstrappingRef.current = false
        setIsBootstrapping(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [projectId])

  // Mark dirty on meaningful changes only:
  // - explicit user edits (node add/move/resize/props/etc.)
  // - canvas config changes that affect persistence
  useEffect(() => {
    if (bootstrappingRef.current) return
    markDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasConfig.name,
    canvasConfig.mode,
    canvasConfig.width,
    canvasConfig.height,
    canvasConfig.bgValue,
    canvasConfig.gridEnabled,
    canvasConfig.gridSize,
  ])

  const openPreview = useCallback(async () => {
    const previewHash = `#/preview?projectId=${encodeURIComponent(projectId)}`

    // Open a new tab synchronously to avoid popup blockers.
    // We'll navigate it to the preview URL after the save completes.
    const previewWindow = window.open('about:blank', '_blank')

    try {
      // Ensure preview loads the latest saved content
      await saveNow()
    } catch (error) {
      // If saving fails, don't leave a blank tab around.
      previewWindow?.close()
      throw error
    }

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
      console.log('[Editor] triggerSave event received, collecting data...');
      // Collect all nodes with their thing model bindings
      const state = store.getState() as KernelState;
      const nodes = Object.values(state.nodesById).map(nodeState => {
        const schema = nodeState.schemaRef as any;
        return {
          id: schema.id,
          type: schema.type,
          position: schema.position,
          size: schema.size,
          props: schema.props,
          // Include thing model bindings if present
          thingModelBindings: schema.thingModelBindings || [],
        };
      });

      // Build export data for ThingsPanel
      const exportData = {
        canvas: {
          mode: canvasConfig.mode,
          width: canvasConfig.width,
          height: canvasConfig.height,
          background: canvasConfig.bgValue,
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

      console.log('[Editor] Sending saveRequest with data:', exportData);
      // Send to host
      requestSave(exportData);
    });

    return unsubscribe;
  }, [canvasConfig]);

  // Handle embed mode init event - load initial data from host
  useEffect(() => {
    if (!isEmbedMode()) return;

    const unsubscribe = onEmbedEvent('init', (payload: any) => {
      console.log('[Editor] Embed init received:', payload);
      
      if (payload?.data) {
        const data = payload.data;
        
        // Load canvas config if provided
        if (data.canvas) {
          setCanvasConfig(prev => ({
            ...prev,
            mode: data.canvas.mode || prev.mode,
            width: data.canvas.width || prev.width,
            height: data.canvas.height || prev.height,
            bgValue: data.canvas.background || prev.bgValue,
          }));
        }
        
        // Load nodes if provided
        if (data.nodes && Array.isArray(data.nodes)) {
          // Convert nodes to NodeSchemaType format and load into store
          const nodesToLoad = data.nodes.map((node: any) => ({
            id: node.id || `node-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: node.type,
            position: node.position || { x: 100, y: 100 },
            size: node.size || { width: 200, height: 80 },
            props: node.props || {},
            thingModelBindings: node.thingModelBindings || [],
          }));
          
          store.getState().loadPage({
            id: `embed-${Date.now()}`,
            type: 'page' as const,
            version: '1.0.0',
            nodes: nodesToLoad,
          });
          
          // Clear undo history for clean start
          try {
            store.temporal.getState().clear?.();
          } catch {}
        }
      }
    });

    // Also check if initial data is already available (in case init was received before this effect ran)
    const initialData = getInitialData();
    if (initialData) {
      console.log('[Editor] Loading already-received initial data:', initialData);
      
      if (initialData.canvas) {
        setCanvasConfig(prev => ({
          ...prev,
          mode: initialData.canvas.mode || prev.mode,
          width: initialData.canvas.width || prev.width,
          height: initialData.canvas.height || prev.height,
          bgValue: initialData.canvas.background || prev.bgValue,
        }));
      }
      
      if (initialData.nodes && Array.isArray(initialData.nodes)) {
        const nodesToLoad = initialData.nodes.map((node: any) => ({
          id: node.id || `node-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: node.type,
          position: node.position || { x: 100, y: 100 },
          size: node.size || { width: 200, height: 80 },
          props: node.props || {},
          thingModelBindings: node.thingModelBindings || [],
        }));
        
        store.getState().loadPage({
          id: `embed-${Date.now()}`,
          type: 'page' as const,
          version: '1.0.0',
          nodes: nodesToLoad,
        });
        
        try {
          store.temporal.getState().clear?.();
        } catch {}
      }
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Sync canvas state to kernel store when config changes
    store.getState().updateCanvas({
      mode: canvasConfig.mode,
      width: canvasConfig.width,
      height: canvasConfig.height
    })
  }, [canvasConfig.mode, canvasConfig.width, canvasConfig.height])

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
      console.error('[Editor] failed to add node', e)
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Handle image picker request from CreateToolLayer
  const handleImagePickerRequest = useCallback(async () => {
    try {
      const result = await pickImage()
      if (result) {
        setPendingImageUrl(result.dataUrl)
      } else {
        // User canceled - reset to select tool
        setActiveTool('select')
        setPendingImageUrl(undefined)
      }
    } catch (error) {
      console.error('[Editor] Image picker error:', error)
      if (error instanceof ImageFileTooLargeError) {
        alert(language === 'zh' ? '图片文件过大，请选择小于 2MB 的图片' : 'Image file is too large. Please select an image smaller than 2MB.')
      }
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
      <div className="absolute inset-0">
        {canvasConfig.mode === 'reflow' ? (
          <GridStackCanvas
            store={store}
            width={canvasConfig.width}
            height={canvasConfig.height}
            activeTool={activeTool}
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
                console.error('[Editor] Failed to add dropped component:', e);
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

      {Object.keys(kernelState.nodesById).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">ThingsVis</h2>
            <p className="text-muted-foreground max-w-md">
              {language === "zh" ? "您的所有数据都保存在浏览器本地。" : "Your data is stored locally in the browser."}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground pointer-events-auto w-64 mx-auto">
              <button
                onClick={() => setShowProjectDialog(true)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4" />
                  <span>{language === "zh" ? "打开" : "Open"}</span>
                </div>
                <span className="text-sm text-muted-foreground">Ctrl+O</span>
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4" />
                  <span>{language === "zh" ? "帮助" : "Help"}</span>
                </div>
                <span className="text-sm text-muted-foreground">?</span>
              </button>
              <button
                onClick={() => console.log('Login clicked - TODO: implement login')}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4" />
                  <span>{language === "zh" ? "登录" : "Login"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
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
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            placeholder="未命名项目"
            className="w-32 h-8 bg-transparent border-0 focus-visible:ring-0 px-2 text-foreground font-medium"
            value={canvasConfig.name}
            onChange={(e) => setCanvasConfig({ ...canvasConfig, name: e.target.value })}
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
                className={`h-9 w-9 rounded-md transition-all focus:ring-0 focus:outline-none ${
                  isActive
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
            onClick={() => console.log('Publish clicked - TODO: implement publish')}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{language === "zh" ? "发布" : "Publish"}</span>
          </Button>
        </div>
      </div>

      {/* Left Panel: Assets & Layers */}
      {embedVisibility.showLibrary && (
      <aside className="absolute left-4 top-20 bottom-4 z-40 w-72">
        <div className="glass rounded-md shadow-xl border border-border h-full flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setLeftPanelTab("components")}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                leftPanelTab === "components"
                  ? "text-foreground border-[#6965db] -mb-px"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              {language === "zh" ? "组件库" : "Library"}
            </button>
            <button
              onClick={() => setLeftPanelTab("layers")}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                leftPanelTab === "layers"
                  ? "text-foreground border-[#6965db] -mb-px"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              {language === "zh" ? "图层" : "Layers"}
            </button>
          </div>

          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "zh" ? "搜索组件..." : "Search components..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 rounded-md"
              />
            </div>
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
          <div className="px-3 min-w-[60px] text-center">
            <span className="text-sm font-medium tabular-nums">{zoom}%</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
            onClick={() => setZoom(Math.min(500, zoom + 10))}
          >
            <Plus className="h-4 w-4" />
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

      {/* Right Panel - Properties */}
      {embedVisibility.showProps && (
      <aside className="absolute right-4 top-20 bottom-4 w-80 z-40">
        <div className="glass rounded-md shadow-xl border border-border h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">{language === "zh" ? "属性" : "Properties"}</h2>
            <button className="p-1 hover:bg-accent rounded" onClick={() => store.getState().selectNode(null)}>
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
                        const newMode = e.target.value as "fixed" | "infinite" | "reflow";
                        if (newMode !== canvasConfig.mode) {
                          const hasNodes = Object.keys(store.getState().nodesById).length > 0;
                          if (hasNodes) {
                            const msg = language === "zh" 
                              ? "切换布局模式将清空当前画布，是否继续？" 
                              : "Switching layout mode will clear the current canvas. Continue?";
                            if (!window.confirm(msg)) return;
                            store.getState().loadPage({ id: canvasConfig.id, type: 'page', version: '1.0.0', nodes: [] });
                            markDirty();
                          }
                          setCanvasConfig({ ...canvasConfig, mode: newMode });
                        }
                      }}
                      className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none"
                    >
                      <option value="fixed">{language === "zh" ? "固定尺寸" : "Fixed Size"}</option>
                      <option value="reflow">{language === "zh" ? "自适应" : "Responsive"}</option>
                      <option value="infinite">{language === "zh" ? "无限画布" : "Infinite Canvas"}</option>
                    </select>
                  </div>

                  {canvasConfig.mode === 'reflow' ? (
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
        onClose={() => setShowProjectDialog(false)}
        onProjectLoad={(project) => {
          // Persist last opened project id
          try {
            localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, project.meta.id)
          } catch {}

          // Load project into kernel store
          const pageData = {
            id: project.meta.id,
            type: 'page' as const,
            version: project.meta.version,
            nodes: project.nodes,
          }
          store.getState().loadPage(pageData)
          try {
            store.temporal.getState().clear?.()
          } catch {}
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
            gridEnabled: project.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: project.canvas.gridSize ?? prev.gridSize,
            dataSources: (project.dataSources as any) ?? prev.dataSources,
          }))
        }}
        onNewProject={() => {
          // Create new empty project
          const newId = crypto.randomUUID()
          try {
            localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, newId)
          } catch {}
          const emptyPage = {
            id: newId,
            type: 'page' as const,
            version: '1.0.0',
            nodes: [],
          }
          store.getState().loadPage(emptyPage)
          try {
            store.temporal.getState().clear?.()
          } catch {}

          setCanvasConfig(prev => ({
            ...prev,
            id: newId,
            name: 'My Visualization',
            createdAt: Date.now(),
            dataSources: [],
          }))
        }}
        currentProject={getProjectState()}
        language={language}
      />

    </div>
  )
}

