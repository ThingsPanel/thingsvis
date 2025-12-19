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
  Sparkles,
  Frame,
  Folder,
  ChevronRight,
  EyeOff,
  Lock,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createKernelStore } from '@thingsvis/kernel'
import type { PageSchemaType, NodeSchemaType } from '@thingsvis/schema'
import { CanvasView } from '@thingsvis/ui'
import { loadPlugin } from '../plugins/pluginResolver'
import { extractDefaults } from '../plugins/schemaUtils'

// Generate UUID helper
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const store = createKernelStore()

type Tool = "select" | "rectangle" | "circle" | "arrow" | "text" | "image" | "pan"
type Language = "zh" | "en"

// Define Layer types
type Layer = {
  id: string
  name: string
  type: "group" | "component"
  visible: boolean
  locked: boolean
  expanded?: boolean // Only for groups
  children?: Layer[] // Only for groups
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>("zh")
  const [showShortcuts, setShowShortcuts] = useState(false)

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

  const { canUndo, canRedo } = useMemo(() => {
    const past = temporalSnapshot.pastStates ?? []
    const future = temporalSnapshot.futureStates ?? []
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0
    }
  }, [temporalSnapshot])

  // Initialize page on mount
  useEffect(() => {
    const emptyPage: PageSchemaType = {
      id: 'studio-page',
      type: 'page',
      version: '1.0.0',
      nodes: []
    }
    store.getState().loadPage(emptyPage)
  }, [])

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

  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "group1",
      name: "页面组 1",
      type: "group",
      visible: true,
      locked: false,
      expanded: true,
      children: [
        { id: "chart1", name: "折线图", type: "component", visible: true, locked: false },
        { id: "text1", name: "标题文本", type: "component", visible: true, locked: false },
      ],
    },
    {
      id: "group2",
      name: "数据展示",
      type: "group",
      visible: true,
      locked: false,
      expanded: false,
      children: [
        { id: "gauge1", name: "仪表盘", type: "component", visible: true, locked: false },
        { id: "table1", name: "数据表格", type: "component", visible: false, locked: false },
      ],
    },
    { id: "bg1", name: "背景图片", type: "component", visible: true, locked: true },
  ])

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

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === id) {
          return { ...layer, visible: !layer.visible }
        }
        if (layer.type === "group" && layer.children) {
          return {
            ...layer,
            children: layer.children.map((child) => (child.id === id ? { ...child, visible: !child.visible } : child)),
          }
        }
        return layer
      }),
    )
  }

  const toggleLayerLock = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === id) {
          return { ...layer, locked: !layer.locked }
        }
        if (layer.type === "group" && layer.children) {
          return {
            ...layer,
            children: layer.children.map((child) => (child.id === id ? { ...child, locked: !child.locked } : child)),
          }
        }
        return layer
      }),
    )
  }

  const toggleGroupExpanded = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id && layer.type === "group" ? { ...layer, expanded: !layer.expanded } : layer,
      ),
    )
  }

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

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Canvas Background with Dot Grid */}
      <div className="absolute inset-0 bg-background dot-grid" />

      {/* Canvas View */}
      <div className="absolute inset-0 pt-14">
        <CanvasView 
          store={store} 
          resolvePlugin={async (type: string) => (await loadPlugin(type)).entry} 
        />
      </div>

      {!selectedElement && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">ThingsVis</h2>
            <p className="text-muted-foreground max-w-md">
              {language === "zh" ? "您的所有数据都保存在浏览器本地。" : "Your data is stored locally in the browser."}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground pointer-events-auto w-64 mx-auto">
              <button
                onClick={() => {}}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4" />
                  <span>{language === "zh" ? "打开" : "Open"}</span>
                </div>
                <span className="text-xs text-muted-foreground">Ctrl+O</span>
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4" />
                  <span>{language === "zh" ? "帮助" : "Help"}</span>
                </div>
                <span className="text-xs text-muted-foreground">?</span>
              </button>
              <button
                onClick={() => {}}
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
      <nav className="absolute top-0 left-0 right-0 z-50 h-14 bg-[#121212] dark:bg-[#121212] border-b border-border/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6965db] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TV</span>
            </div>
            <span className="text-white font-semibold">ThingsVis</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Input
            placeholder="未命名项目"
            className="w-56 h-8 bg-transparent border-0 focus-visible:ring-0 px-2 text-white"
            defaultValue="My Visualization"
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{language === "zh" ? "所有更改已保存" : "All changes saved"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                <Languages className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("zh")}>
                <span className={language === "zh" ? "font-semibold" : ""}>中文</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                <span className={language === "en" ? "font-semibold" : ""}>English</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-white" />}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-white rounded-md">
            <Eye className="h-4 w-4" />
            {language === "zh" ? "预览" : "Preview"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-white rounded-md">
            <Share2 className="h-4 w-4" />
            {language === "zh" ? "分享" : "Share"}
          </Button>
          <Button size="sm" className="h-8 gap-2 rounded-md bg-[#6965db] hover:bg-[#5854c7]">
            <Upload className="h-4 w-4" />
            {language === "zh" ? "发布" : "Publish"}
          </Button>
        </div>
      </nav>

      {/* Main Menu Button */}
      <div className="absolute top-16 left-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="glass rounded-md shadow-md h-9 w-9">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="gap-2">
              <FolderOpen className="h-4 w-4" />
              {language === "zh" ? "打开项目" : "Open Project"}
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+O</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Save className="h-4 w-4" />
              {language === "zh" ? "保存" : "Save"}
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
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
      </div>

      {/* Toolbar with Undo/Redo */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50">
        <div className="glass rounded-md shadow-lg px-2 py-1.5 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md"
            disabled={!canUndo}
            onClick={handleUndo}
            title={language === "zh" ? "撤销" : "Undo"}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md"
            disabled={!canRedo}
            onClick={handleRedo}
            title={language === "zh" ? "重做" : "Redo"}
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-md transition-colors ${
                  activeTool === tool.id ? "bg-[#6965db]/20 text-[#6965db]" : ""
                }`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </div>

      {/* Left Panel: Assets & Layers */}
      <aside className="absolute left-4 top-28 bottom-4 z-40 w-72">
        <div className="glass rounded-md shadow-lg h-full flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setLeftPanelTab("components")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                leftPanelTab === "components"
                  ? "text-foreground border-b-2 border-[#6965db]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                {language === "zh" ? "组件库" : "Components"}
              </div>
            </button>
            <button
              onClick={() => setLeftPanelTab("layers")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                leftPanelTab === "layers"
                  ? "text-foreground border-b-2 border-[#6965db]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Layers className="h-4 w-4" />
                {language === "zh" ? "图层" : "Layers"}
              </div>
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
              <Accordion type="multiple" defaultValue={["basic", "charts"]} className="space-y-2">
                {/* 1. 基础组件 */}
                <AccordionItem value="basic" className="border-0">
                  <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline">
                    {language === "zh" ? "基础组件" : "Basic"}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-1 px-2">
                    <div className="space-y-3">
                      {/* 文本 */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 pl-0.5">
                          {language === "zh" ? "文本" : "Text"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleAddNode("layout/text")}
                            className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2"
                          >
                            <Type className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {language === "zh" ? "标题" : "Title"}
                            </span>
                          </button>
                          <button className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2">
                            <Repeat className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {language === "zh" ? "跑马灯" : "Marquee"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* 交互控制 */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 pl-0.5">
                          {language === "zh" ? "交互控制" : "Controls"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleAddNode("basic/switch")}
                            className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2"
                          >
                            <ToggleLeft className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {language === "zh" ? "开关" : "Switch"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. 图表组件 */}
                <AccordionItem value="charts" className="border-0">
                  <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline">
                    {language === "zh" ? "图表组件" : "Charts"}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-1 px-2">
                    <div className="space-y-3">
                      {/* ECharts */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 pl-0.5">ECharts</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleAddNode("chart/echarts-bar")}
                            className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2"
                          >
                            <BarChart3 className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {language === "zh" ? "柱状图" : "Bar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. 媒体展示 */}
                <AccordionItem value="media" className="border-0">
                  <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline">
                    {language === "zh" ? "媒体展示" : "Media"}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-1 px-2">
                    <div className="space-y-3">
                      {/* 图片 */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 pl-0.5">
                          {language === "zh" ? "图片" : "Image"}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleAddNode("media/image")}
                            className="h-20 rounded border border-border hover:border-[#6965db] hover:bg-accent flex flex-col items-center justify-center gap-1.5 transition-colors p-2"
                          >
                            <ImageIcon className="h-6 w-6 text-foreground" />
                            <span className="text-xs text-foreground font-medium">
                              {language === "zh" ? "静态图" : "Image"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div key={layer.id}>
                    <div
                      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-accent cursor-pointer ${
                        selectedElement === layer.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedElement(layer.id)}
                    >
                      {layer.type === "group" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleGroupExpanded(layer.id)
                          }}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                              layer.expanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      )}
                      {layer.type === "component" && <div className="w-4" />}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        {layer.type === "group" ? (
                          <Folder className="h-4 w-4 text-[#6965db] flex-shrink-0" />
                        ) : (
                          <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{layer.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLayerVisibility(layer.id)
                          }}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          {layer.visible ? (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLayerLock(layer.id)
                          }}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          <Lock
                            className={`h-3.5 w-3.5 ${layer.locked ? "text-[#6965db]" : "text-muted-foreground"}`}
                          />
                        </button>
                      </div>
                    </div>
                    {layer.type === "group" && layer.expanded && layer.children && (
                      <div className="ml-5 space-y-1 mt-1">
                        {layer.children.map((child) => (
                          <div
                            key={child.id}
                            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-accent cursor-pointer ${
                              selectedElement === child.id ? "bg-accent" : ""
                            }`}
                            onClick={() => setSelectedElement(child.id)}
                          >
                            <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm flex-1 truncate">{child.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleLayerVisibility(child.id)
                                }}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                {child.visible ? (
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleLayerLock(child.id)
                                }}
                                className="p-0.5 hover:bg-muted rounded"
                              >
                                <Lock
                                  className={`h-3.5 w-3.5 ${child.locked ? "text-[#6965db]" : "text-muted-foreground"}`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Panel - Properties */}
      <aside className="absolute right-4 top-28 bottom-4 w-80 z-40">
        <div className="glass rounded-md shadow-lg h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">{language === "zh" ? "属性" : "Properties"}</h2>
            <button className="p-1 hover:bg-accent rounded" onClick={() => setSelectedElement(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedElement ? (
              <>
                {/* Element Properties */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {language === "zh" ? "名称" : "Name"}
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6965db] focus:border-[#6965db]"
                    defaultValue={language === "zh" ? "矩形 1" : "Rectangle 1"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">X</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6965db] focus:border-[#6965db]"
                      defaultValue={100}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Y</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6965db] focus:border-[#6965db]"
                      defaultValue={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {language === "zh" ? "宽度" : "Width"}
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6965db] focus:border-[#6965db]"
                      defaultValue={200}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {language === "zh" ? "高度" : "Height"}
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6965db] focus:border-[#6965db]"
                      defaultValue={100}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Canvas Settings */}
                <div className="space-y-4 pb-4 border-b border-border">
                  <h3 className="text-xs font-semibold text-foreground">
                    {language === "zh" ? "基础信息" : "Basic Info"}
                  </h3>

                  <div className="space-y-3">
                    <label className="text-xs font-medium">{language === "zh" ? "页面名称" : "Page Name"}</label>
                    <Input
                      value={canvasConfig.name}
                      onChange={(e) => setCanvasConfig({ ...canvasConfig, name: e.target.value })}
                      className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium">{language === "zh" ? "页面ID" : "Page ID"}</label>
                    <Input
                      value={canvasConfig.id}
                      readOnly
                      className="h-8 text-sm rounded-md bg-muted focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    />
                  </div>
                </div>

                <div className="space-y-4 pb-4 border-b border-border">
                  <h3 className="text-xs font-semibold text-foreground">
                    {language === "zh" ? "画布配置" : "Canvas Config"}
                  </h3>

                  <div className="space-y-3">
                    <label className="text-xs font-medium">{language === "zh" ? "布局模式" : "Layout Mode"}</label>
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
                      <label className="text-xs font-medium">{language === "zh" ? "宽度" : "Width"}</label>
                      <Input
                        type="number"
                        value={canvasConfig.width}
                        onChange={(e) => setCanvasConfig({ ...canvasConfig, width: Number(e.target.value) })}
                        className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{language === "zh" ? "高度" : "Height"}</label>
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
    </div>
  )
}

