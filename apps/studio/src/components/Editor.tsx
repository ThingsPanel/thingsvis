import { useState, useCallback, useMemo, useEffect } from "react"
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
import { commandRegistry, useKeyboardShortcuts, registerDefaultCommands } from '../lib/commands'

// Generate UUID helper
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

type Tool = "select" | "rectangle" | "circle" | "arrow" | "text" | "image" | "pan"
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
  mode: "fixed" | "infinite" | "reflow"
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

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfigSchema>({
    // Meta - 基础身份
    id: generateId(),
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
    mode: "infinite" as "fixed" | "infinite" | "reflow",
    width: 1920,
    height: 1080,
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
  })

  // Project state for auto-save
  const [projectId] = useState(() => crypto.randomUUID())

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
    enabled: true,
  })

  // Mark dirty when kernel state changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      markDirty()
    })
    return unsubscribe
  }, [markDirty])

  // Register default commands with the command registry
  useEffect(() => {
    registerDefaultCommands({
      saveProject: async () => { await saveNow() },
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
      openPreview: async () => {
        // Save project before entering in-editor preview
        await saveNow()
        window.location.hash = `#/preview?projectId=${encodeURIComponent(projectId)}`
      },
    })
  }, [saveNow, projectId])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ registry: commandRegistry })

  useEffect(() => {
    // Sync canvas state to kernel store when config changes
    console.log('[Editor] Syncing canvas config to store:', canvasConfig.mode, canvasConfig.width, canvasConfig.height);
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
      const node: NodeSchemaType = {
        id: `node-${componentType}-${now}`,
        type: componentType,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 80 },
        props: defaultProps
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

  const tools = [
    { id: "select" as Tool, icon: MousePointer2, label: "选择" },
    { id: "rectangle" as Tool, icon: Square, label: "矩形" },
    { id: "circle" as Tool, icon: Circle, label: "圆形" },
    { id: "arrow" as Tool, icon: ArrowRight, label: "连接线" },
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
      <div className="absolute inset-0 bg-background dot-grid" />

      {/* Canvas View */}
      <div className="absolute inset-0">
        <CanvasView
          pageId={canvasConfig.id}
          store={store}
          activeTool={activeTool}
          resolvePlugin={resolvePlugin}
          zoom={zoom / 100}
          onZoomChange={(newZoom) => setZoom(Math.round(newZoom * 100))}
        />
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
        <div className="glass rounded-md shadow-md border border-border flex items-center gap-4 px-4 py-2 pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-md bg-[#6965db] hover:bg-[#5851db] flex items-center justify-center">
                  <Menu className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-foreground font-bold tracking-tight">ThingsVis</span>
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
            defaultValue="My Visualization"
          />

          <SaveIndicator
            status={saveState.status}
            lastSavedAt={saveState.lastSavedAt}
            error={saveState.error}
            className="ml-1 pr-2"
          />
        </div>

        {/* Center Side: Tools */}
        <div className="glass rounded-md shadow-md border border-border flex items-center gap-1 px-2 py-1.5 pointer-events-auto">
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
        <div className="glass rounded-md shadow-md border border-border flex items-center gap-2 px-3 py-2 pointer-events-auto">
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
            onClick={async () => {
              await saveNow()
              window.location.hash = `#/preview?projectId=${encodeURIComponent(projectId)}`
            }}
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
              <LayerPanel store={store} language={language} searchQuery={searchQuery} />
            ) : (
              <DataPanel store={store} language={language} />
            )}
          </div>
        </div>
      </aside>

      {/* Bottom Left Controls: Zoom & Undo/Redo */}
      <div className="absolute left-[324px] bottom-8 z-40 flex items-center gap-3 select-none">
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
                      onChange={(e) =>
                        setCanvasConfig({ ...canvasConfig, mode: e.target.value as "fixed" | "infinite" | "reflow" })
                      }
                      className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none"
                    >
                      <option value="infinite">{language === "zh" ? "无限画布" : "Infinite Canvas"}</option>
                      <option value="fixed">{language === "zh" ? "固定尺寸" : "Fixed Size"}</option>
                      <option value="reflow">{language === "zh" ? "自适应" : "Reflow"}</option>
                    </select>
                  </div>

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
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

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
          // Load project into kernel store
          const pageData = {
            id: project.meta.id,
            type: 'page' as const,
            version: project.meta.version,
            nodes: project.nodes,
          }
          store.getState().loadPage(pageData)
          // Update canvas config
          setCanvasConfig(prev => ({
            ...prev,
            id: project.meta.id,
            name: project.meta.name,
            mode: project.canvas.mode,
            width: project.canvas.width,
            height: project.canvas.height,
            bgValue: project.canvas.background,
            gridEnabled: project.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: project.canvas.gridSize ?? prev.gridSize,
          }))
        }}
        onNewProject={() => {
          // Create new empty project
          const emptyPage = {
            id: crypto.randomUUID(),
            type: 'page' as const,
            version: '1.0.0',
            nodes: [],
          }
          store.getState().loadPage(emptyPage)
        }}
        currentProject={getProjectState()}
        language={language}
      />

    </div>
  )
}

