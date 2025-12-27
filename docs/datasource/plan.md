# 方案A：Kernel层数据源管理器 + React Query UI层 - 实施方案

## 1. 核心架构概述

本方案采用 **Kernel 负责逻辑与配置管理**，**UI 层负责状态与副作用管理** 的分离架构。

- **Kernel Layer**: 负责维护数据源的配置（Schema）、注册适配器（Adapters）以及数据转换逻辑。它不直接依赖 React，保持纯净。
- **UI Layer**: 利用 React Query (TanStack Query) 的强大缓存、重试和状态管理能力，结合 Kernel 提供的适配器进行数据获取。
- **Plugin Layer**: 插件通过统一的 Hook 接口消费数据，无需关心底层是 HTTP 还是 MQTT。

## 2. Schema 定义修改 (`@thingsvis/schema`)

我们需要扩展现有的 Schema 定义，以支持数据源的持久化存储和组件的数据绑定。

### 2.1 新增 `DataSourceSchema`
定义全局可用的数据源配置。

```typescript
// packages/thingsvis-schema/src/datasource.ts

import { z } from 'zod';

// 增加 'static-json' 作为内置支持
export const DataSourceType = z.enum(['static-json', 'rest-api', 'mqtt', 'websocket', 'database']);

export const DataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: DataSourceType,
  // 不同类型的特定配置，例如 URL, Headers, Auth
  config: z.record(z.any()), 
});

export type DataSourceSchemaType = z.infer<typeof DataSourceSchema>;
```

### 2.2 修改 `NodeSchema`
在组件节点定义中增加 `data` 字段，用于描述该组件如何绑定数据。

```typescript
// packages/thingsvis-schema/src/node-schema.ts

export const DataBindingSchema = z.object({
  // 引用的数据源 ID
  sourceId: z.string().optional(),
  // 查询参数 (对于 API 是 endpoint/params，对于 MQTT 是 topic，对于 Static 是 JSON 内容)
  query: z.record(z.any()).optional(),
  // 数据转换脚本 (JS 函数体字符串)
  transform: z.string().optional(),
  // 自动刷新间隔 (毫秒)，0 为不自动刷新
  autoRefresh: z.number().default(0),
});

export const NodeSchema = z.object({
  // ... 原有字段
  id: z.string(),
  type: z.string(),
  // ...
  
  // 新增数据绑定配置
  data: DataBindingSchema.optional(),
});
```

## 3. Kernel 层实现 (`@thingsvis/kernel`)

### 3.1 `DataSourceManager`
负责管理所有注册的数据源实例和适配器。

- **职责**:
  - 维护 `dataSources` 列表 (Store)。
  - 注册/注销适配器工厂 (Adapter Factory)。
  - 根据 `sourceId` 获取对应的适配器实例。

### 3.2 `IDataSourceAdapter` 接口
所有数据源插件必须实现的接口。

```typescript
export interface IDataSourceAdapter<TConfig = any, TQuery = any> {
  // 初始化连接 (如 MQTT connect)
  connect(config: TConfig): Promise<void>;
  
  // 断开连接
  disconnect(): Promise<void>;
  
  // 拉取模式 (REST, DB, Static)
  fetch(query: TQuery): Promise<any>;
  
  // 推送模式 (MQTT, WS) - 返回取消订阅函数
  subscribe(query: TQuery, onData: (data: any) => void): () => void;
  
  // 测试连接有效性
  test(config: TConfig): Promise<boolean>;
}
```

### 3.3 `DataTransformEngine`
一个简单的执行引擎，用于运行用户定义的 `transform` 脚本。建议使用 `new Function` 或沙箱环境执行，将原始数据转换为组件所需的格式。

## 4. UI 层与 React Query 集成 (`@thingsvis/ui`)

### 4.1 `useDataSource` Hook
这是组件（或组件包装器）使用的核心 Hook。

- **逻辑**:
  1. 读取传入的 `NodeSchema.data` 配置。
  2. 从 Kernel 获取对应的 Adapter。
  3. **如果是拉取型 (REST/Static)**: 调用 `useQuery`，`queryFn` 内部执行 `adapter.fetch()`。
  4. **如果是推送型 (MQTT)**: 调用 `useEffect` 建立订阅，收到数据后更新 React Query 的缓存 (`queryClient.setQueryData`) 或本地 State。
  5. 执行 `transform` 逻辑。
  6. 返回 `{ data, isLoading, error }`。

### 4.2 `DataSourceProvider`
在应用顶层提供 Context，持有 `QueryClient` 和 `DataSourceManager` 的引用。

## 5. 编辑器修改与配置流程 (`apps/studio`)

### 5.1 数据源管理面板 (Global)
新增一个左侧或顶部面板，用于管理“全局数据源”。
- 列表展示所有已配置的数据源 (MySQL Prod, Weather API, IoT MQTT)。
- 提供表单新增/编辑数据源配置。

### 5.2 属性面板升级 (`PropsPanel.tsx`)
修改右侧属性面板，增加 **"数据 (Data)"** Tab。

#### 配置流程设计 (UI/UX)
1.  **数据源选择 (Source Selection)**
    *   下拉框列出所有全局数据源。
    *   **特殊选项**: "静态数据 (Static JSON)"。这是内置的默认选项，无需在全局配置。
2.  **查询配置 (Query Configuration)**
    *   根据选择的源类型动态渲染表单。
    *   **REST API**: 显示 Method (GET/POST), URL Path, Params 输入框。
    *   **MQTT**: 显示 Topic 输入框。
    *   **Static JSON**: 显示一个 Monaco Editor (JSON 模式)，允许用户直接粘贴 JSON 数据。
3.  **数据转换 (Data Transformation)**
    *   提供一个 JS 代码编辑器。
    *   默认模板: `return data;`
    *   用户编写: `return data.map(item => ({ x: item.time, y: item.value }));`
4.  **预览与调试 (Preview)**
    *   "运行/刷新" 按钮。
    *   展示 "原始数据" 和 "转换后数据" 的对比视图。
    *   如果出错，显示具体的错误信息。

## 6. 组件开发标准 (v2)

### 6.1 "纯粹"组件原则 (Dumb Components)
为了保证组件的可复用性和测试性，可视化组件必须遵循以下原则：

1.  **无副作用**: 组件内部**严禁**发起网络请求 (fetch/axios)。
2.  **数据驱动**: 组件完全由 `props` 驱动。
3.  **Schema 定义**: 组件必须导出一个 `propSchema` (通常使用 Zod)，明确声明它需要的数据结构。

**示例**:
```typescript
// components/BarChart.tsx
export const BarChartSchema = z.object({
  data: z.array(z.object({
    label: z.string(),
    value: z.number()
  }))
});

export const BarChart = ({ data }) => {
  // 纯渲染逻辑
  return <ECharts option={{ series: [{ data }] }} />;
};
```

### 6.2 运行时包装器 (Runtime Wrapper)
系统在渲染画布时，不会直接渲染 `BarChart`，而是渲染 `DataContainer(BarChart)`。

1.  **DataContainer**: 一个高阶组件。
2.  **职责**:
    *   读取当前节点的 `data` 配置。
    *   调用 `useDataSource` 获取数据。
    *   处理 `loading` 和 `error` 状态 (显示骨架屏或错误提示)。
    *   将最终数据注入给 `BarChart` 的 `data` 属性。

## 7. 模拟数据与静态开发 (Mocking Strategy)

在没有后端接口的情况下，如何进行开发和演示？

### 7.1 内置 Static JSON Adapter
这是系统默认提供的能力，无需额外插件。
- **原理**: 将用户输入的 JSON 字符串直接作为 `fetch` 的返回值。
- **优势**: 
    - 走完全相同的 `useDataSource` -> `transform` 流程。
    - 切换到真实 API 时，只需更改数据源 ID，转换脚本通常无需修改。

### 7.2 最佳实践流程
1.  **阶段一 (原型)**: 开发者在属性面板选择 "Static JSON"，粘贴预期的后端返回格式，编写 `transform` 脚本适配组件。
2.  **阶段二 (联调)**: 后端接口就绪。开发者在全局配置中添加 "REST API" 数据源。
3.  **阶段三 (切换)**: 在属性面板将数据源从 "Static JSON" 切换为 "REST API"，填入 URL。由于数据结构一致，图表自动生效。

## 8. 行业最佳实践参考

本方案参考了 Grafana, Retool, Low-Code 平台的通用设计模式：

1.  **Data Source as a Resource**: 数据源是独立于组件存在的资源，可以被多个组件复用 (Connection Pooling)。
2.  **Transformation Pipeline**: 数据获取与数据展示中间必须有一层转换层 (ETL)，解耦前后端。
3.  **Declarative Bindings**: 组件不关心数据来源，只关心数据格式。
4.  **Query Library**: 复杂的 SQL 或 API 请求可以被保存为模板 (Query Library)，供不同组件调用。

## 9. 基础组件与属性绑定系统 (Asset & Binding System)

针对图片、文字、SVG 等基础元素，不应强制使用 CLI 开发插件。我们需要一套内置的资产管理和属性绑定机制。

### 9.1 组件分类策略
我们将组件分为两类：

1.  **代码组件 (Code Components)**:
    *   **定义**: 逻辑复杂、交互丰富、通常由第三方开发的组件（如 ECharts, 3D 模型查看器）。
    *   **开发方式**: 使用 CLI 脚手架，打包为插件，动态加载。
    *   **数据流**: 主要依赖 `props.data` 接收结构化数据。

2.  **内置资产组件 (Built-in Asset Components)**:
    *   **定义**: 平台核心自带的基础原子组件（Image, Text, Rect, Circle, Container, SVG）。
    *   **开发方式**: 硬编码在渲染引擎 (`VisualEngine`) 中，无需插件加载。
    *   **数据流**: 依赖 **属性绑定 (Property Binding)** 机制，将任意属性链接到数据源。

### 9.2 属性绑定表达式 (Property Binding)
为了让基础组件也能“动”起来（例如：根据 API 返回改变图片 URL，或根据 MQTT 消息改变文字内容），我们需要引入表达式系统。

*   **语法**: 使用双大括号 `{{ }}` 包裹 JavaScript 表达式。
*   **上下文**: 表达式内部可以访问 `query` 对象（当前节点绑定的数据源结果）。

**示例场景**:
*   **文本组件**:
    *   `props.text` = `"当前温度: {{ query.data.temperature }} ℃"`
*   **图片组件**:
    *   `props.src` = `{{ query.data.status === 'alarm' ? 'http://assets/alarm.png' : 'http://assets/normal.png' }}`
*   **矩形组件**:
    *   `props.fill` = `{{ query.data.value > 80 ? '#ff0000' : '#00ff00' }}`

### 9.3 资源管理 (Asset Management)
虽然暂无后台上传功能，但设计需预留接口。

*   **Image 组件**:
    *   `src` 属性支持:
        1.  **Remote URL**: `https://example.com/image.png`
        2.  **Data URI**: `data:image/png;base64,...` (用于本地拖拽上传的临时方案)
        3.  **Asset ID**: `asset://uuid-1234` (未来对接资源库)
*   **SVG 组件**:
    *   支持直接嵌入 SVG 代码字符串 (`props.content`)，允许修改 `fill` 等内部属性。

## 10. 总结与推荐

此方案完美契合 React 生态。
- **React Query** 解决了缓存、去重、加载状态管理等复杂问题。
- **Kernel Adapter** 解决了多协议兼容问题。
- **Schema 分离** 保证了配置的可序列化和持久化。
- **Static JSON** 提供了完美的 Mock 方案。
- **属性绑定系统** 解决了基础组件的动态化需求。

**下一步行动**:
1. 在 `thingsvis-schema` 中添加 `DataSourceSchema` 和 `NodeDataBindingSchema`。
2. 在 `thingsvis-kernel` 中搭建 `DataSourceManager` 骨架。
3. 实现一个基础的 `RestApiAdapter` 和 `StaticJsonAdapter`。
4. 在渲染引擎中实现基础的表达式解析器。