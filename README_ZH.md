# ThingsVis

**[English](README.md) | 中文**

**ThingsVis** 是一个工业级、低代码可视化平台，内置基于画布的编辑器，用于创建交互式可视化应用。它专为桌面控制台设计，提供强大的插件生态系统和微内核架构，用于构建可扩展的可视化应用程序。

## 🌟 特性

- **画布编辑器**: 直观的拖拽式界面，用于创建可视化内容
- **插件生态系统**: 可扩展架构，拥有 7 大类组件分类体系
- **微内核设计**: 严格分离无 UI 的内核逻辑与可视化组件
- **Module Federation 2.0**: 支持动态插件加载及离线缓存
- **高性能**: 针对 ≥50 FPS 渲染进行优化，支持 1000+ 节点
- **类型安全**: 基于 TypeScript 5.x 构建，启用严格模式，并使用 Zod 进行运行时验证
- **撤销/重做系统**: 完整的命令模式实现，包含历史记录管理
- **高级数据源**: 企业级 REST (Auth/Body) 和 WebSocket (心跳/重连) 支持

## 🏗️ 架构

### Monorepo 结构

```
thingsvis/
├── apps/
│   ├── studio/          # 主编辑器应用
│   └── preview/         # 用于测试插件的简单宿主应用
├── packages/
│   ├── thingsvis-kernel/    # 无 UI 核心逻辑
│   ├── thingsvis-schema/    # 基于 Zod 的类型定义
│   ├── thingsvis-ui/        # 无头可视化组件
│   └── thingsvis-utils/     # 共享工具库
├── plugins/
│   ├── basic/           # 基础组件 (矩形, 文本等)
│   ├── layout/          # 布局组件
│   ├── media/           # 媒体组件 (图片, 视频)
│   ├── chart/           # 图表组件
│   ├── custom/          # 自定义组件
│   ├── data/            # 数据组件
│   └── interaction/     # 交互组件
├── tools/
│   └── cli/             # 用于脚手架插件的 vis-cli
├── configs/             # 共享构建配置
└── specs/               # 详细的功能规格说明 (单一事实来源)
```

### 核心技术

- **TypeScript 5.x** - 启用严格模式以保证类型安全
- **Rspack + Module Federation 2.0** - 快速构建和动态插件加载
- **React 18** - UI 渲染层
- **LeaferJS** - 高性能 2D 画布渲染
- **Zustand + Immer** - 状态管理与不可变更新
- **Zod** - 运行时 Schema 验证
- **TailwindCSS** - 实用优先的样式库
- **Turborepo** - Monorepo 构建编排
- **pnpm** - 快速、节省磁盘空间的包管理器

## 🚀 快速开始

### 前置要求

- **Node.js** 18+
- **pnpm** 8+ (通过 `npm install -g pnpm` 安装)

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd thingsvis

# 安装依赖
pnpm install
```

### 开发

#### 运行 Studio 应用

```bash
# 启动主编辑器
pnpm dev --filter ./apps/studio

# 或者使用简写
pnpm dev
```

Studio 将在 `http://localhost:3000` (或终端显示的端口) 上可用。

#### 运行 Preview 应用

```bash
# 启动预览/测试应用
pnpm dev --filter ./apps/preview
```

### 构建

```bash
# 构建所有包和应用 (推荐)
pnpm -w build

# 替代方案: 使用 turbo 构建
pnpm build

# 构建指定包
pnpm build --filter @thingsvis/kernel
pnpm build --filter @thingsvis/schema
pnpm build --filter @thingsvis/ui

# 构建所有插件
pnpm build:plugins

# 构建 studio 应用
pnpm build --filter ./apps/studio
```

### 类型检查

```bash
# 检查所有包的类型
pnpm typecheck

# 检查指定包的类型
pnpm typecheck --filter @thingsvis/kernel
```

## 🔌 插件开发

ThingsVis 提供了一个强大的 CLI 工具来快速生成新插件。

### 创建新插件

```bash
# 生成新插件
pnpm vis-cli create <category> <plugin-name>

# 示例: 创建基础按钮组件
pnpm vis-cli create basic button

# 示例: 创建自定义折线图
pnpm vis-cli create chart line-chart
```

**可用分类:**
- `basic` - 基础 UI 组件
- `layout` - 布局组件
- `media` - 媒体组件 (图片, 视频)
- `chart` - 图表和数据可视化
- `custom` - 自定义组件
- `data` - 数据相关组件
- `interaction` - 交互组件

### 插件结构

每个生成的插件包含：

```
plugins/<category>/<name>/
├── package.json          # 插件包配置
├── rspack.config.js      # 构建配置
├── tsconfig.json         # TypeScript 配置
├── README.md             # 插件文档
├── public/
│   └── index.html        # 开发服务器着陆页
└── src/
    ├── index.ts          # 插件主入口 (导出 Main 模块)
    └── spec.tsx          # 视觉隔离测试组件
```

### 开发插件

```bash
# 进入插件目录
cd plugins/<category>/<name>

# 启动开发服务器 (作为 Module Federation remote 服务)
pnpm dev

# 插件将在 http://localhost:<port>/remoteEntry.js 可用
```

### 插件 API

每个插件必须导出一个符合 `PluginMainModule` 接口的 `Main` 模块：

```typescript
import type { PluginMainModule } from '@thingsvis/schema';

export const Main: PluginMainModule = {
  componentId: 'category/name',
  create: () => {
    // 返回一个 Leafer 兼容的元素
    return new Rect({ width: 100, height: 100, fill: '#ff0000' });
  },
  Spec: SpecComponent, // 可选: 视觉测试组件
};
```

### 注册插件

将插件添加到注册表文件 (`apps/preview/public/registry.json` 或 `apps/studio/public/registry.json`):

```json
{
  "remoteName": "thingsvis-plugin-basic-button",
  "remoteEntryUrl": "http://localhost:3100/remoteEntry.js",
  "componentId": "basic/button",
  "version": "0.0.1"
}
```

### 视觉测试

每个插件包含一个 `spec.tsx` 文件用于隔离视觉测试：

1. 启动插件开发服务器: `pnpm dev`
2. 打开 preview 应用: `pnpm dev --filter ./apps/preview`
3. 在 spec runner 中选择你的插件
4. 验证渲染和错误隔离

## 📦 包概览

### @thingsvis/kernel

无 UI 核心引擎，提供：

- 状态管理 (Zustand + Immer)
- 命令模式与撤销/重做
- 插件通信事件总线
- 历史记录管理
- 节点生命周期管理

**关键 API:**

```typescript
import {
  createNodeDropActionCommand,
  getPage,
  eventBus,
  HistoryManager
} from '@thingsvis/kernel';
```

### @thingsvis/schema

基于 Zod 的运行时类型验证和 TypeScript 类型：

- `PageSchema` - 页面结构验证
- `NodeSchema` - 节点/组件验证
- `PluginMainModule` - 插件接口定义
- 所有数据结构的运行时验证

### @thingsvis/ui

无头可视化组件和渲染工具：

- Module Federation 插件加载器
- 注册表管理
- 离线缓存 (IndexedDB)
- 组件隔离和错误边界

### @thingsvis/utils

跨包共享工具：

- 通用辅助函数
- 类型工具
- 常量和枚举

## 🛠️ 开发工作流

### 典型开发流程

1. **启动 Studio**
   ```bash
   pnpm dev --filter ./apps/studio
   ```

2. **创建新插件**

   ```bash
   pnpm vis-cli create custom my-widget
   ```

3. **开发插件**

   ```bash
   cd plugins/custom/my-widget
   pnpm dev
   ```

4. **在 Preview 中测试**
   - 打开 preview 应用
   - 通过 registry 加载插件
   - 测试视觉渲染和交互

5. **构建生产版本**

   ```bash
   pnpm build
   ```

### 使用包 (Packages) 工作

修改核心包 (`kernel`, `schema`, `ui`) 时：

```bash
# 1. 修改包代码
# 2. 重新构建包
pnpm build --filter @thingsvis/kernel

# 3. 通过 workspace 链接，修改会自动应用到应用程序
# 4. 重启开发服务器以查看更改
```

### 代码质量

```bash
# 类型检查
pnpm typecheck

# Lint (若配置)
pnpm lint

# 运行所有检查
pnpm typecheck && pnpm lint
```

## 🏛️ 架构原则

### 微内核设计 (Micro-Kernel Design)

- **Kernel** (`@thingsvis/kernel`): 纯逻辑，无 UI 依赖
- **UI Layer** (`@thingsvis/ui`): 可视化组件，无业务逻辑
- **Schema** (`@thingsvis/schema`): 共享契约和验证
- **Plugins**: 自包含、隔离的组件

### 宪法驱动开发 (Constitution-Driven Development)

ThingsVis 遵循严格的架构约束：

1. **关注点分离**: Kernel 保持无 UI
2. **插件隔离**: 插件不能反向依赖 Kernel
3. **类型安全**: TypeScript 严格模式 + Zod 运行时验证
4. **性能目标**:
   - 核心包 < 800KB
   - ≥50 FPS 渲染
   - 支持 1000+ 节点
5. **构建策略**: Rspack + Module Federation 2.0
6. **状态管理**: Zustand + Immer 实现不可变更新

### 插件生态系统

**7 类组件分类:**

1. **Basic** - 基础 UI 元素 (矩形, 文本, 圆形)
2. **Layout** - 布局和容器组件
3. **Media** - 图片, 视频和媒体播放器
4. **Chart** - 数据可视化和图表
5. **Custom** - 自定义/专用组件
6. **Data** - 数据相关组件
7. **Interaction** - 交互元素和控件

**插件特性:**

- 通过 Module Federation 动态加载
- 使用 IndexedDB 进行离线缓存
- 错误隔离 (故障不会导致宿主崩溃)
- 隔离的视觉测试
- 开发中的热模块替换 (HMR)

## 📚 文档

详细文档可在 `docs/` 目录中找到 (英文)：

- **[开发指南](docs/development/guide.md)**: 环境设置、工作流和 Git 规范。
- **[Spec-Kit 速查表](docs/development/spec-kit.md)**: AI 驱动的开发工作流。
- **[组件开发](docs/component/development.md)**: 如何构建自定义插件。
- **[数据源配置](docs/datasource/configuration.md)**: 配置 REST (认证, Headers), WebSocket (心跳, 重连) 和 MQTT。

## 🤝 贡献

**在开始之前，请阅读我们的 [贡献指南](CONTRIBUTING_ZH.md)。**

### 开发设置

1. Fork 并克隆仓库
2. 安装依赖: `pnpm install`
3. 创建特性分支: `git checkout -b feature/my-feature`
4. 进行更改
5. 运行类型检查: `pnpm typecheck`
6. 构建验证: `pnpm build`
7. 提交并推送更改
8. 创建 Pull Request

### 编码规范

- **TypeScript**: 启用严格模式，禁止隐式 any
- **命名**: 文件使用 kebab-case，组件使用 PascalCase
- **导入**: 使用包名的绝对导入
- **注释**: 记录复杂逻辑和公共 API
- **测试**: 为新功能添加测试

### 插件开发指南

1. 使用 `vis-cli` 生成新插件
2. 遵循分类体系
3. 导出有效的 `PluginMainModule`
4. 包含 `Spec` 组件进行视觉测试
5. 保持插件自包含和隔离
6. 对共享库 (React, LeaferJS) 使用 peer dependencies

## 📄 许可证

[在此处添加许可证信息]

## 🙏 致谢

构建于：

- [React](https://react.dev/) - UI 库
- [LeaferJS](https://www.leaferjs.com/) - 画布渲染
- [Rspack](https://www.rspack.dev/) - 快速打包器
- [Module Federation](https://module-federation.io/) - 微前端架构
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [Zod](https://zod.dev/) - Schema 验证
- [TailwindCSS](https://tailwindcss.com/) - 样式
- [Turborepo](https://turbo.build/) - Monorepo 工具

---

**ThingsVis** - 面向现代 Web 的工业级可视化平台。
