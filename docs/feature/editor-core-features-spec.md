# ThingsVis 编辑器核心功能技术方案

**Version**: 1.0.0  
**Last Updated**: 2026-01-06  
**Status**: Draft - 待确认

---

## 📋 目录

- [1. 概述](#1-概述)
- [2. 竞品分析](#2-竞品分析)
- [3. 功能一：保存/打开项目](#3-功能一保存打开项目)
- [4. 功能二：快捷键系统](#4-功能二快捷键系统)
- [5. 功能三：预览功能](#5-功能三预览功能)
- [6. 实现计划](#6-实现计划)
- [7. 待确认事项](#7-待确认事项)

---

## 1. 概述

本文档针对 ThingsVis 编辑器的三个核心功能进行竞品分析和技术方案设计：

| 优先级 | 功能 | 目标 |
|--------|------|------|
| 🔴 高 | 保存/打开项目 | 项目持久化，支持本地/云端存储 |
| 🔴 高 | 快捷键监听 | 提升用户操作效率 |
| 🟡 中 | 预览功能 | 完整编辑-预览工作流 |

---

## 2. 竞品分析

### 2.1 Figma

| 功能 | 实现方式 | 亮点 |
|------|----------|------|
| **保存** | 实时自动保存到云端，无需手动保存 | 版本历史、协作编辑 |
| **打开** | 云端项目列表、最近访问、搜索 | 支持 .fig 文件导入 |
| **快捷键** | 完整快捷键面板 (Ctrl+Shift+?) | 分类展示、高亮已使用 |
| **预览** | Present Mode (Ctrl+P) | 全屏预览、交互原型 |

**快捷键设计特点：**
- 工具切换: V(选择), R(矩形), O(圆形), T(文本), H(抓手)
- 编辑操作: Ctrl+Z(撤销), Ctrl+Shift+Z(重做), Ctrl+D(复制)
- 视图控制: Ctrl++/-(缩放), Space+拖拽(平移)

### 2.2 Excalidraw

| 功能 | 实现方式 | 亮点 |
|------|----------|------|
| **保存** | Local-first，自动保存到 localStorage + IndexedDB | PWA 离线支持 |
| **打开** | Ctrl+O 打开 .excalidraw JSON 文件 | 开放格式 |
| **导出** | PNG, SVG, 剪贴板, .excalidraw JSON | 多格式导出 |
| **快捷键** | ? 键打开帮助面板 | 简洁直观 |
| **预览** | 无独立预览模式（所见即所得） | - |

**存储策略亮点：**
```
┌─────────────────────────────────────────┐
│  Excalidraw 本地存储架构                 │
├─────────────────────────────────────────┤
│  localStorage: 快速访问，小数据          │
│  IndexedDB: 大数据、离线缓存             │
│  File System Access API: 直接文件读写    │
└─────────────────────────────────────────┘
```

### 2.3 Grafana

| 功能 | 实现方式 | 亮点 |
|------|----------|------|
| **保存** | Dashboard JSON，服务端持久化 | 版本控制、标签系统 |
| **导出** | JSON/YAML (多种 schema), PDF, PNG | 企业级导出能力 |
| **分享** | 内部链接、外部链接、嵌入代码、快照 | 灵活的分享机制 |
| **快捷键** | 面板级快捷键 (e 编辑, d 删除等) | 上下文相关 |

**Dashboard JSON 结构参考：**
```json
{
  "id": null,
  "uid": "abc123",
  "title": "My Dashboard",
  "tags": ["production", "monitoring"],
  "timezone": "browser",
  "panels": [...],
  "templating": { "list": [...] },
  "time": { "from": "now-6h", "to": "now" },
  "version": 1
}
```

### 2.4 阿里云 DataV

| 功能 | 实现方式 | 亮点 |
|------|----------|------|
| **保存** | 云端自动保存 + 手动保存 | 草稿/发布状态 |
| **打开** | 项目列表、模板库 | 丰富模板 |
| **预览** | 独立预览窗口、大屏预览 | 自适应分辨率 |
| **发布** | 生成独立访问链接 | 密码保护、访问统计 |

### 2.5 竞品对比总结

| 特性 | Figma | Excalidraw | Grafana | DataV | **ThingsVis (推荐)** |
|------|-------|------------|---------|-------|---------------------|
| 存储位置 | 云端 | 本地优先 | 服务端 | 云端 | **本地优先 + 可选云端** |
| 文件格式 | .fig | .excalidraw (JSON) | JSON/YAML | 私有 | **.thingsvis (JSON)** |
| 自动保存 | ✅ | ✅ | ❌ | ✅ | **✅ (可配置)** |
| 离线支持 | ❌ | ✅ (PWA) | ❌ | ❌ | **✅ (IndexedDB)** |
| 快捷键面板 | ✅ | ✅ | 部分 | 部分 | **✅** |
| 预览模式 | Present | 无 | Kiosk | 独立窗口 | **新标签页/内嵌** |

---

## 3. 功能一：保存/打开项目

### 3.1 推荐方案：本地优先 + 文件系统

采用 Excalidraw 的 **Local-first** 策略，结合现代 File System Access API：

```
┌─────────────────────────────────────────────────────────────┐
│                    ThingsVis 存储架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │  IndexedDB   │    │  File System │    │   Cloud      │ │
│   │  (自动保存)   │    │  Access API  │    │  (可选)      │ │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │
│          │                   │                   │         │
│          ▼                   ▼                   ▼         │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Project Storage Service                 │  │
│   │  - 自动保存 (每 30s 或内容变更)                       │  │
│   │  - 手动保存 (Ctrl+S)                                  │  │
│   │  - 导出/导入 (.thingsvis JSON)                        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术规格

#### 3.2.1 项目文件格式 (.thingsvis)

```typescript
interface ThingsVisProjectFile {
  // 元数据
  meta: {
    version: string          // 文件格式版本，如 "1.0.0"
    createdAt: number        // 创建时间戳
    updatedAt: number        // 最后更新时间戳
    name: string             // 项目名称
    description?: string     // 项目描述
    thumbnail?: string       // Base64 缩略图
  }
  
  // 画布配置
  canvas: {
    mode: 'fixed' | 'infinite' | 'reflow'
    width: number
    height: number
    background: string
    gridEnabled: boolean
    gridSize: number
  }
  
  // 节点数据
  nodes: NodeSchemaType[]
  
  // 图层顺序
  layerOrder: string[]
  
  // 图层分组
  layerGroups: Record<string, LayerGroup>
  
  // 数据源配置
  dataSources: DataSourceConfig[]
  
  // 变量
  variables: Record<string, any>
}
```

#### 3.2.2 存储服务接口

```typescript
interface ProjectStorageService {
  // IndexedDB 自动保存
  autoSave(projectId: string, state: KernelState): Promise<void>
  loadFromAutoSave(projectId: string): Promise<KernelState | null>
  clearAutoSave(projectId: string): Promise<void>
  
  // 文件系统操作
  saveToFile(state: KernelState): Promise<void>           // 使用 File System Access API
  openFromFile(): Promise<KernelState>                    // 选择并读取文件
  exportAsJson(state: KernelState): Blob                  // 下载 JSON
  importFromJson(file: File): Promise<KernelState>        // 导入 JSON
  
  // 项目列表 (IndexedDB)
  listProjects(): Promise<ProjectMeta[]>
  deleteProject(projectId: string): Promise<void>
}
```

#### 3.2.3 自动保存策略

| 触发条件 | 延迟 | 说明 |
|----------|------|------|
| 节点增删改 | 1s 防抖 | 用户操作后 1 秒内无新操作则保存 |
| 定时保存 | 30s | 无论是否有变更 |
| 页面离开 | 立即 | beforeunload 事件 |
| 手动保存 | 立即 | Ctrl+S |

### 3.3 UI 交互设计

#### 打开项目对话框
```
┌─────────────────────────────────────────────────────┐
│  打开项目                                      [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📂 最近项目                                        │
│  ├─ 📄 My Visualization (2 小时前)                  │
│  ├─ 📄 Dashboard Demo (昨天)                        │
│  └─ 📄 PM25 Monitor (3 天前)                        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [📁 打开本地文件]     [🔗 导入 JSON]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 保存状态指示器
```
┌─────────────────────────────────────┐
│  ThingsVis  │  My Visualization  │  ● 已保存  │
└─────────────────────────────────────┘
                                       ↓
┌─────────────────────────────────────┐
│  ThingsVis  │  My Visualization  │  ○ 保存中...  │
└─────────────────────────────────────┘
                                       ↓
┌─────────────────────────────────────┐
│  ThingsVis  │  My Visualization  │  ⚠ 未保存  │
└─────────────────────────────────────┘
```

---

## 4. 功能二：快捷键系统

### 4.1 推荐方案：全局 Hook + 命令系统

参考 Figma 和 Excalidraw 的快捷键设计，建立统一的命令系统：

```
┌─────────────────────────────────────────────────────────────┐
│                    快捷键系统架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│   │   Keyboard   │    │   Command    │    │   Action     │ │
│   │   Listener   │───▶│   Registry   │───▶│   Executor   │ │
│   └──────────────┘    └──────────────┘    └──────────────┘ │
│                              │                              │
│                              ▼                              │
│                    ┌──────────────────┐                    │
│                    │  Shortcut Panel  │                    │
│                    │  (? 键触发)       │                    │
│                    └──────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 快捷键映射表

#### 工具切换

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `V` | 选择工具 | 默认工具 |
| `R` | 矩形工具 | 绘制矩形 |
| `O` | 圆形工具 | 绘制椭圆 |
| `L` | 连接线工具 | 节点连接 |
| `T` | 文本工具 | 添加文本 |
| `H` / `Space+拖拽` | 平移画布 | 移动视图 |

#### 编辑操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+Z` | 撤销 | 恢复上一步 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | 重做 | 重做撤销的操作 |
| `Ctrl+C` | 复制 | 复制选中节点 |
| `Ctrl+V` | 粘贴 | 粘贴节点 |
| `Ctrl+D` | 原地复制 | 复制并偏移 |
| `Delete` / `Backspace` | 删除 | 删除选中节点 |
| `Ctrl+A` | 全选 | 选中所有节点 |
| `Escape` | 取消选择 | 清空选区 |

#### 项目操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+S` | 保存 | 保存项目 |
| `Ctrl+O` | 打开 | 打开项目对话框 |
| `Ctrl+E` | 导出 | 导出配置 |
| `Ctrl+P` | 预览 | 打开预览模式 |

#### 视图操作

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl++` / `Ctrl+=` | 放大 | 增加缩放 |
| `Ctrl+-` | 缩小 | 减少缩放 |
| `Ctrl+0` | 重置缩放 | 缩放到 100% |
| `Ctrl+1` | 适应画布 | 缩放到适应视图 |

#### 帮助

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `?` / `Ctrl+/` | 快捷键面板 | 显示所有快捷键 |

### 4.3 技术规格

#### 命令注册表

```typescript
interface Command {
  id: string                           // 唯一标识，如 'editor.save'
  label: string                        // 显示名称
  labelZh?: string                     // 中文名称
  shortcut: string[]                   // 快捷键组合，如 ['ctrl', 's']
  category: 'tool' | 'edit' | 'view' | 'project' | 'help'
  when?: (state: KernelState) => boolean  // 启用条件
  execute: () => void                  // 执行函数
}

// 命令注册
const commandRegistry = new Map<string, Command>()

// 注册示例
commandRegistry.set('editor.save', {
  id: 'editor.save',
  label: 'Save',
  labelZh: '保存',
  shortcut: ['ctrl', 's'],
  category: 'project',
  execute: () => projectStorage.save()
})
```

#### useKeyboardShortcuts Hook

```typescript
function useKeyboardShortcuts(commands: Map<string, Command>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框内的按键
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        // 但仍处理 Escape 键
        if (e.key !== 'Escape') return
      }
      
      const pressed = buildKeyCombo(e)  // 如 'ctrl+s'
      
      for (const cmd of commands.values()) {
        if (matchShortcut(pressed, cmd.shortcut)) {
          e.preventDefault()
          if (!cmd.when || cmd.when(store.getState())) {
            cmd.execute()
          }
          break
        }
      }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commands])
}
```

### 4.4 快捷键面板 UI

```
┌─────────────────────────────────────────────────────────────┐
│  ⌨️ 快捷键                                            [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔧 工具                          📝 编辑                   │
│  ─────────────────                ─────────────────         │
│  V    选择工具                    Ctrl+Z   撤销             │
│  R    矩形工具                    Ctrl+Y   重做             │
│  O    圆形工具                    Ctrl+C   复制             │
│  L    连接线工具                  Ctrl+V   粘贴             │
│  T    文本工具                    Ctrl+D   原地复制         │
│  H    平移画布                    Delete   删除             │
│                                   Ctrl+A   全选             │
│                                   Esc      取消选择         │
│                                                             │
│  📁 项目                          👁️ 视图                   │
│  ─────────────────                ─────────────────         │
│  Ctrl+S   保存                    Ctrl++   放大             │
│  Ctrl+O   打开                    Ctrl+-   缩小             │
│  Ctrl+E   导出                    Ctrl+0   重置缩放         │
│  Ctrl+P   预览                    Ctrl+1   适应画布         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 功能三：预览功能

### 5.0 预览功能竞品深度分析

#### 5.0.1 竞品预览模式对比

| 产品 | 预览架构 | 入口方式 | 数据传递 | 独立应用 | 全屏支持 |
|------|----------|----------|----------|----------|----------|
| **Figma** | Present Mode | Ctrl+P / 按钮 | 内存共享 | ❌ 同窗口 | ✅ 浏览器全屏 |
| **Excalidraw** | 所见即所得 | 无独立预览 | - | ❌ | ❌ |
| **Grafana** | Kiosk Mode | `d+k` / URL参数 | URL Query | ✅ 独立URL | ✅ `?kiosk` |
| **乐吾乐 2D** | 云发布预览 | 预览按钮 | 服务端 | ✅ 独立页面 | ✅ 自适应 |
| **DataV** | 独立预览窗口 | 新窗口 | 云端同步 | ✅ 独立URL | ✅ 大屏适配 |

#### 5.0.2 竞品实现细节

**Grafana Kiosk Mode：**
```
# URL 参数控制预览模式
/d/dashboard-id?kiosk        # 隐藏顶栏和侧边栏
/d/dashboard-id?kiosk=tv     # TV 模式（循环播放）

# 快捷键
d+k: 切换 Kiosk 模式
Esc: 退出 Kiosk 模式
```

**Figma Present Mode：**
- 编辑器内嵌预览，点击 ▶️ 按钮或 Ctrl+P 进入
- 左侧显示 Flow 列表，可切换不同原型流
- 支持全屏 (Fullscreen API)
- 分享链接：`/proto/<file-id>?node-id=<frame-id>`
- 可生成「仅原型」分享链接，不暴露源文件

**乐吾乐 2D 预览特性：**
- 编辑器内「预览」按钮 → 新标签页打开
- 支持 PC/平板/手机 多端自适应
- 画布属性中可配置「预览不充满窗口」选项
- 云发布后生成独立访问链接

#### 5.0.3 ThingsVis 架构决策：复用 apps/preview

**现状分析：**
当前 `apps/preview` 是一个**开发调试工具**，具备以下能力：
- 性能测试 (Generate 1000 Nodes)
- 插件 Schema 验证 (Load Spec)
- Undo/Redo 测试
- CanvasView 渲染

**方案A：双模式复用架构 ✅ (已选定)**

```
┌─────────────────────────────────────────────────────────────┐
│                    apps/preview 双模式架构                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   URL: /preview                    URL: /preview?mode=user  │
│   ┌─────────────────┐              ┌─────────────────┐     │
│   │  开发调试模式    │              │  用户预览模式    │     │
│   │  (dev mode)     │              │  (user mode)    │     │
│   ├─────────────────┤              ├─────────────────┤     │
│   │ • 1000节点生成   │              │ • 只读渲染      │     │
│   │ • Schema 测试   │              │ • 全屏支持      │     │
│   │ • Undo/Redo     │              │ • 数据源连接    │     │
│   │ • 插件选择器    │              │ • 隐藏工具栏    │     │
│   │ • Debug 工具栏  │              │ • 自适应布局    │     │
│   └─────────────────┘              └─────────────────┘     │
│           ↑                                  ↑              │
│           │ development                      │ production  │
│           └──────────── 共享渲染引擎 ────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**参考 Grafana 的 URL 参数模式：**
```
# 开发模式 (默认)
http://localhost:3001/preview

# 用户预览模式
http://localhost:3001/preview?mode=user

# 全屏 Kiosk 模式
http://localhost:3001/preview?mode=kiosk

# 从 Studio 打开预览 (带数据)
http://localhost:3001/preview?mode=user&session=<token>
```

**vs 竞品的优势对比：**

| 特性 | Grafana | Figma | 乐吾乐 | **ThingsVis (方案A)** |
|------|---------|-------|--------|----------------------|
| 开发调试工具 | ❌ | ❌ | ❌ | ✅ 复用 |
| URL 模式切换 | ✅ `?kiosk` | ❌ | ❌ | ✅ `?mode=` |
| 独立部署 | ✅ | ❌ | ✅ | ✅ |
| 代码复用 | - | - | - | ✅ 共享组件 |
| 渐进式增强 | ❌ | ❌ | ❌ | ✅ |

### 5.1 推荐方案：多模式预览

结合 DataV 的大屏预览和 Figma 的 Present Mode，以及 Grafana 的 URL 参数模式：

```
┌─────────────────────────────────────────────────────────────┐
│                    预览系统架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Preview Manager                      │   │
│   └───────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│   │ 内嵌预览  │     │ 新标签页  │     │ 全屏模式  │           │
│   │ (Split)  │     │ (Tab)    │     │ (Kiosk)  │           │
│   └──────────┘     └──────────┘     └──────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 预览模式对比

| 模式 | 触发方式 | 使用场景 | 数据源 |
|------|----------|----------|--------|
| **内嵌预览** | 点击按钮 | 快速查看效果 | 实时同步 |
| **新标签页** | Ctrl+P | 独立预览 | 序列化快照 |
| **全屏模式** | F11 或按钮 | 大屏展示 | 独立数据连接 |

### 5.3 技术规格

#### 5.3.0 apps/preview 模式切换实现

```typescript
// apps/preview/src/App.tsx 改造

type PreviewMode = 'dev' | 'user' | 'kiosk'

function usePreviewMode(): PreviewMode {
  const searchParams = new URLSearchParams(window.location.search)
  const mode = searchParams.get('mode')
  
  if (mode === 'kiosk') return 'kiosk'
  if (mode === 'user') return 'user'
  return 'dev'  // 默认开发模式
}

function App() {
  const mode = usePreviewMode()
  
  return (
    <div className="app">
      {/* 开发模式显示调试工具栏 */}
      {mode === 'dev' && <DevToolbar />}
      
      {/* 用户模式显示简化工具栏 */}
      {mode === 'user' && <UserToolbar />}
      
      {/* Kiosk 模式无工具栏 */}
      
      {/* 共享渲染区域 */}
      <CanvasView 
        readonly={mode !== 'dev'}
        autoFit={mode === 'kiosk'}
      />
    </div>
  )
}
```

#### 预览数据序列化

```typescript
interface PreviewPayload {
  // 画布配置
  canvas: {
    mode: string
    width: number
    height: number
    background: string
  }
  
  // 节点快照
  nodes: NodeSchemaType[]
  
  // 数据源配置 (用于重新连接)
  dataSources: DataSourceConfig[]
  
  // 当前数据状态 (可选，用于快照预览)
  dataSnapshot?: Record<string, any>
}
```

#### 预览 URL 方案

```
# 新标签页预览
/preview?mode=tab&data=<base64-encoded-payload>

# 全屏模式 (使用 URL hash 避免数据泄露到服务器)
/preview#<base64-encoded-payload>

# 通过 sessionStorage 传递大数据
/preview?session=<session-key>
```

### 5.4 预览 UI 交互

#### 预览按钮下拉菜单

```
┌─────────────────────────────┐
│  👁️ 预览  ▼                │
├─────────────────────────────┤
│  ▶️ 在新标签页预览  Ctrl+P  │
│  📺 全屏预览模式            │
│  ─────────────────────────  │
│  🔗 复制预览链接            │
│  📤 分享预览                │
└─────────────────────────────┘
```

#### 预览页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回编辑器   │  My Visualization  │  🔄 刷新  │  ⛶ 全屏  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                    ┌───────────────────┐                    │
│                    │                   │                    │
│                    │   可视化内容区域   │                    │
│                    │   (居中/自适应)    │                    │
│                    │                   │                    │
│                    └───────────────────┘                    │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 预览页面功能

| 功能 | 说明 |
|------|------|
| **自适应布局** | 根据视口大小自动缩放/居中 |
| **数据实时更新** | 连接数据源，实时刷新 |
| **交互支持** | 组件内部交互正常工作 |
| **响应式** | 支持多种分辨率预览 |
| **返回编辑** | 一键返回编辑器 |

---

## 6. 实现计划

### 6.1 开发阶段

| 阶段 | 功能 | 预估工时 | 依赖 |
|------|------|----------|------|
| **P1** | IndexedDB 自动保存 | 4h | - |
| **P1** | 快捷键 Hook 基础框架 | 4h | - |
| **P1** | 工具切换快捷键 | 2h | P1 快捷键框架 |
| **P2** | 打开/保存对话框 UI | 4h | P1 自动保存 |
| **P2** | 编辑操作快捷键 | 4h | P1 快捷键框架 |
| **P2** | 快捷键帮助面板 | 3h | P1 快捷键框架 |
| **P3** | apps/preview 模式切换改造 | 4h | - |
| **P3** | 用户预览模式 UI (user mode) | 3h | P3 模式切换 |
| **P3** | Kiosk 全屏模式 | 2h | P3 模式切换 |
| **P4** | 文件系统 API 集成 | 4h | P1 自动保存 |
| **P4** | 导入/导出 JSON | 2h | P1 自动保存 |

### 6.2 文件结构

```
apps/studio/src/
├── lib/
│   ├── storage/
│   │   ├── indexedDb.ts           # IndexedDB 封装
│   │   ├── projectStorage.ts      # 项目存储服务
│   │   └── autoSave.ts            # 自动保存逻辑
│   ├── commands/
│   │   ├── commandRegistry.ts     # 命令注册表
│   │   ├── shortcuts.ts           # 快捷键映射
│   │   └── useKeyboardShortcuts.ts # 快捷键 Hook
│   └── preview/
│       └── previewBridge.ts       # 预览数据通信
├── components/
│   ├── Modals/
│   │   ├── OpenProjectDialog.tsx  # 打开项目对话框
│   │   ├── ShortcutsPanel.tsx     # 快捷键面板
│   │   └── ExportDialog.tsx       # 导出对话框
│   └── ...
└── ...

apps/preview/src/
├── App.tsx                        # 改造：支持 mode 参数
├── components/
│   ├── DevToolbar.tsx             # 开发调试工具栏 (现有)
│   ├── UserToolbar.tsx            # 新增：用户预览工具栏
│   └── KioskView.tsx              # 新增：Kiosk 全屏视图
├── hooks/
│   └── usePreviewMode.ts          # 新增：模式检测
└── ...
```

---

## 7. 最终确定方案

以下为经过确认的最终设计决策：

### 7.1 存储策略 ✅

| 决策项 | 最终方案 | 说明 |
|--------|----------|------|
| **自动保存间隔** | 与 Excalidraw 一致 | 内容变更后 1 秒防抖 + 定期 10 秒检查 |
| **项目文件扩展名** | `.thingsvis` | 符合项目命名规范，JSON 格式 |
| **云端同步** | 预留接口 | 本地优先 + 云端同步接口预留 |

**Excalidraw 自动保存策略参考：**
- 内容变更后立即标记为 dirty
- 1 秒内无新变更则触发保存
- 每 10 秒检查一次是否有未保存内容
- 页面关闭前 (beforeunload) 强制保存

### 7.2 快捷键 ✅

| 决策项 | 最终方案 | 说明 |
|--------|----------|------|
| **Mac 兼容性** | 区分 Ctrl/Cmd | Mac 使用 Cmd 键，Windows 使用 Ctrl 键 |
| **自定义快捷键** | 暂不支持 | MVP 阶段使用固定快捷键映射 |
| **冲突处理** | 优先拦截 | `e.preventDefault()` 阻止浏览器默认行为 |

**平台适配规则：**
```typescript
const isMac = navigator.platform.toUpperCase().includes('MAC')
const modKey = isMac ? 'meta' : 'ctrl'  // Cmd vs Ctrl

// 快捷键显示
const displayModKey = isMac ? '⌘' : 'Ctrl'
```

### 7.3 预览功能 ✅

| 决策项 | 最终方案 | 说明 |
|--------|----------|------|
| **架构方案** | 方案A：复用 apps/preview | 双模式架构，开发/用户模式共存 |
| **预览模式** | URL 参数切换 (`?mode=`) | 参考 Grafana Kiosk 模式设计 |
| **数据传递** | postMessage + 加密令牌 | 安全性考虑，不使用 URL 传参 |
| **全屏模式** | 支持 F11 全屏 | Fullscreen API + `?mode=kiosk` |

**复用 apps/preview 的优势：**
- ✅ 开发调试功能保留 (1000节点测试、Schema验证)
- ✅ 复用现有渲染引擎和组件
- ✅ 参考 Grafana 的 URL 参数模式 (`?kiosk`)
- ✅ 独立部署能力 (微前端架构)

**模式对照表：**
| URL | 模式 | 用途 | 工具栏 |
|-----|------|------|--------|
| `/preview` | dev | 开发调试 | 完整调试工具 |
| `/preview?mode=user` | user | 用户预览 | 返回/刷新/全屏 |
| `/preview?mode=kiosk` | kiosk | 大屏展示 | 无 (纯净模式) |

**安全数据传递方案：**
```typescript
// 方案：使用 postMessage + 一次性令牌
// 1. 编辑器生成加密令牌，存入 sessionStorage
// 2. 预览页通过 postMessage 请求数据
// 3. 编辑器验证来源后发送数据
// 4. 令牌使用后立即销毁
```

---

## 8. 最终技术规格总结

### 8.1 保存/打开项目

```
存储架构：
┌─────────────────────────────────────────────────┐
│                本地优先 + 云端预留               │
├─────────────────────────────────────────────────┤
│  IndexedDB          localStorage       Cloud    │
│  (项目数据)          (最近列表)         (预留)   │
│      ↓                   ↓                ↓     │
│  ┌─────────────────────────────────────────┐   │
│  │         ProjectStorageService           │   │
│  │  - autoSave(): 自动保存                  │   │
│  │  - save(): 手动保存                      │   │
│  │  - open(): 打开项目                      │   │
│  │  - export(): 导出 JSON                   │   │
│  │  - import(): 导入 JSON                   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 8.2 快捷键系统

```
快捷键架构：
┌─────────────────────────────────────────────────┐
│              跨平台快捷键系统                     │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌───────────┐      ┌───────────────────┐     │
│   │ Keyboard  │      │ Command Registry  │     │
│   │ Listener  │─────▶│ (统一命令注册)      │     │
│   │ (全局监听) │      │                   │     │
│   └───────────┘      └─────────┬─────────┘     │
│                                │               │
│        ┌───────────────────────┼───────────┐   │
│        ▼                       ▼           ▼   │
│   ┌─────────┐           ┌─────────┐  ┌───────┐ │
│   │ Mac     │           │ Windows │  │ Help  │ │
│   │ ⌘+S     │           │ Ctrl+S  │  │ Panel │ │
│   └─────────┘           └─────────┘  └───────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 8.3 预览系统

```
预览架构：方案A - 复用 apps/preview
┌─────────────────────────────────────────────────────────────┐
│              apps/preview 双模式架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   apps/studio                    apps/preview               │
│   ┌───────────┐                 ┌───────────────────────┐  │
│   │           │  postMessage    │                       │  │
│   │ Editor    │◀───────────────▶│  ?mode=dev (开发调试)  │  │
│   │           │  (加密令牌)      │  ?mode=user (用户预览) │  │
│   └───────────┘                 │  ?mode=kiosk (全屏)    │  │
│        │                         └───────────────────────┘  │
│        ▼                                   │                │
│   Ctrl+P 打开                              ▼                │
│   新标签页预览                        共享渲染引擎           │
│                                      CanvasView             │
│                                                             │
│   URL 模式参考 (Grafana Kiosk Mode)：                        │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ /preview               → 开发调试 (调试工具栏)        │  │
│   │ /preview?mode=user     → 用户预览 (简化工具栏)        │  │
│   │ /preview?mode=kiosk    → 全屏展示 (无工具栏)          │  │
│   │ /preview?mode=user&session=<token> → 带数据的预览    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   全屏支持：                                                 │
│   - F11 快捷键触发                                          │
│   - Fullscreen API                                         │
│   - Kiosk 模式 (隐藏所有工具栏)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 修改历史

| 日期 | 版本 | 作者 | 说明 |
|------|------|------|------|
| 2026-01-06 | 1.0.0 | Copilot | 初稿 |
| 2026-01-06 | 1.1.0 | Copilot | 确认最终方案 |

---

**方案已确认，请确认后我将生成 spec-kit 格式的正式规格文档。**
