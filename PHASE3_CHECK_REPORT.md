# 第三阶段验收检查报告

## 检查时间
2025-01-27

## 检查结果概览

| 检查项 | 状态 | 符合度 |
|--------|------|--------|
| 1. 组件注册中心 (Registry) | ✅ 已实现 | 100% |
| 2. Schema/Props 默认值注入 | ❌ 缺失 | 0% |
| 3. 本地缓存适配器 | ⚠️ 部分实现 | 50% |
| 4. 复杂组件隔离性 | ❌ 未测试 | 0% |
| 5. AI 生成组件验证 | ✅ 已实现 | 100% |

---

## 详细检查结果

### ✅ 1. 组件注册中心 (Registry) - 符合要求

**现状：**
- ✅ 已实现 `registry.json` 映射表 (`apps/preview/public/registry.json`)
- ✅ 已实现 `fetchRegistryMap()` 函数 (`apps/preview/src/plugins/registryClient.ts`)
- ✅ `loadPlugin()` 通过 Registry 动态解析组件 ID (`apps/preview/src/plugins/pluginResolver.ts:24`)
- ✅ 使用 Zod Schema 验证 Registry 格式 (`packages/thingsvis-schema/src/component-registry.ts`)

**代码证据：**
```19:28:apps/preview/src/plugins/pluginResolver.ts
export async function loadPlugin(componentId: string): Promise<LoadedPlugin> {
  const existing = pluginCache.get(componentId);
  if (existing) return existing;

  const p = (async () => {
    const registry = await fetchRegistryMap();
    const entry = registry[componentId];
    if (!entry) {
      throw new Error(`Component "${componentId}" not found in registry`);
    }
```

**结论：** ✅ 完全符合要求，没有硬编码的 switch case 或静态 import。

---

### ❌ 2. Schema/Props 默认值注入机制 - 不符合要求

**问题：**
1. **插件模块未暴露 Schema**：
   - `PluginMainModule` 接口 (`packages/thingsvis-schema/src/plugin-module.ts`) 只包含 `componentId`, `create`, `Spec`
   - **缺少 `schema` 或 `manifest` 字段**

2. **编辑器硬编码默认值**：
   - 当前代码中没有 `addStandardNode` 函数（用户提到的）
   - 但 `handleGenerate` 中硬编码了 `type: 'rect'` 和 `props: { fill: randomColor() }`
   - 没有从远程组件包读取 Schema 默认值

3. **违背 "Data is Truth" 原则**：
   - 编辑器不应该知道 `layout/text` 的默认字号是 28
   - 这些信息应该来自组件自身的 Schema 定义

**缺失的代码：**
- 插件包中没有 `config.json` 或 Schema 导出
- `loadPlugin` 返回的 `LoadedPlugin` 类型中没有 `schema` 字段
- 没有 `extractDefaults()` 函数从 Schema 提取默认值

**修改建议：**
1. 扩展 `PluginMainModule` 接口，添加 `schema?: ComponentSchema` 字段
2. 在插件模板中添加 Schema 定义（Zod Schema）
3. 修改 `loadPlugin` 返回类型，包含 `schema`
4. 创建节点时，从 Schema 读取默认值而不是硬编码

---

### ⚠️ 3. 本地缓存适配器 - 部分实现

**现状：**
- ✅ 已实现 `RemoteEntryCache.ts` (IndexedDB 缓存)
- ✅ `UniversalLoader.registerRemoteCached()` 方法已实现
- ❌ **但 `pluginResolver.ts` 中未启用缓存**

**问题代码：**
```30:32:apps/preview/src/plugins/pluginResolver.ts
    // 开发阶段：直接使用远程 URL 注册 remote，避免 Blob/ObjectURL → manifest 解析导致的 RUNTIME-003。
    // 后续如果要启用 IndexedDB 缓存，再切回 UniversalLoader.registerRemoteCached。
    await UniversalLoader.registerRemote(entry.remoteName, entry.remoteEntryUrl);
```

**风险：**
- 每次刷新页面都会重新 fetch `remoteEntry.js`
- 大屏加载 1000 个节点时会重复请求网络，可能导致卡死
- 不符合 "类似 VSCode 的本地下载" 要求

**修改建议：**
- 将 `registerRemote` 改为 `registerRemoteCached(entry.remoteName, entry.remoteEntryUrl, entry.version)`
- 确保版本匹配机制正常工作

---

### ❌ 4. 复杂组件隔离性 - 未测试

**现状：**
- ✅ 有 `HeadlessErrorBoundary` 组件 (`packages/thingsvis-ui/src/components/HeadlessErrorBoundary.tsx`)
- ✅ `VisualEngine` 有错误处理机制 (`packages/thingsvis-ui/src/engine/VisualEngine.ts:116-122`)
- ❌ **但没有 ECharts 组件进行测试**
- ❌ **没有容器组件测试**
- ❌ **没有 DOM/Canvas 混合渲染测试**

**缺失的测试场景：**
1. **图表组件**：封装 ECharts 的组件，测试 Canvas (Leafer) 和 DOM (ECharts div) 混合渲染
2. **样式隔离**：ECharts 组件是否带入全局 CSS 污染
3. **错误边界**：让 `custom/cyber-clock` 故意 throw error，验证是否只有该组件显示错误，其他组件正常

**当前错误处理：**
```116:122:packages/thingsvis-ui/src/engine/VisualEngine.ts
        } catch (e) {
          // Fail closed: render error placeholder for this type
          this.rendererByType.set(type, errorRenderer);
          this.errorMessageByType.set(type, e instanceof Error ? e.message : String(e));
          // eslint-disable-next-line no-console
          console.error('[VisualEngine] failed to resolve plugin renderer:', type, e);
        }
```

**问题：**
- 错误处理是**按类型 (type)** 的，不是按节点 (node) 的
- 如果 `custom/cyber-clock` 类型的一个节点出错，所有该类型的节点都会显示错误占位符
- 需要验证：单个节点错误是否影响其他节点

**修改建议：**
1. 创建一个 ECharts 组件进行混合渲染测试
2. 测试样式隔离（检查是否有全局 CSS 污染）
3. 改进错误处理：按节点 ID 记录错误，而不是按类型

---

### ✅ 5. AI 生成组件验证 - 符合要求

**现状：**
- ✅ 有 `custom/cyber-clock` 组件 (`plugins/custom/cyber-clock/`)
- ✅ CLI 脚手架已实现 (`tools/cli/src/index.ts`)
- ✅ 组件结构符合标准（`componentId`, `create`, `Spec`）

**验证：**
- 组件 ID: `custom/cyber-clock` ✅
- 导出 Main 模块 ✅
- 有 Spec 组件用于隔离测试 ✅
- 在 registry.json 中注册 ✅

**结论：** ✅ 符合要求，可以作为 AI 生成组件的标准案例。

---

## 立即需要修改的问题

### 优先级 P0（阻塞验收）

1. **Schema/Props 默认值注入** ❌
   - 扩展 `PluginMainModule` 接口添加 `schema` 字段
   - 修改插件模板，要求导出 Schema
   - 实现 `extractDefaults()` 函数
   - 修改节点创建逻辑，从 Schema 读取默认值

2. **启用本地缓存** ⚠️
   - 将 `pluginResolver.ts` 中的 `registerRemote` 改为 `registerRemoteCached`
   - 确保版本匹配逻辑正确

### 优先级 P1（建议补充）

3. **复杂组件测试** ❌
   - 创建一个 ECharts 组件
   - 测试 DOM/Canvas 混合渲染
   - 测试样式隔离
   - 测试错误边界（单个节点错误不影响其他节点）

---

## 修改建议代码示例

### 1. 扩展 PluginMainModule 接口

```typescript
// packages/thingsvis-schema/src/plugin-module.ts
export type PluginMainModule = {
  componentId: PluginComponentId;
  create: () => unknown;
  Spec?: unknown;
  // 新增：组件 Schema 定义
  schema?: {
    props?: {
      [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        default?: unknown;
        description?: string;
      };
    };
  };
};
```

### 2. 修改 loadPlugin 返回类型

```typescript
// apps/preview/src/plugins/pluginResolver.ts
type LoadedPlugin = {
  entry: PluginMainModule;
  schema?: PluginMainModule['schema']; // 新增
};
```

### 3. 实现 extractDefaults 函数

```typescript
// apps/preview/src/plugins/schemaUtils.ts
export function extractDefaults(schema?: PluginMainModule['schema']): Record<string, unknown> {
  if (!schema?.props) return {};
  const defaults: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(schema.props)) {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    }
  }
  return defaults;
}
```

### 4. 启用缓存

```typescript
// apps/preview/src/plugins/pluginResolver.ts
// 修改第 32 行
await UniversalLoader.registerRemoteCached(
  entry.remoteName,
  entry.remoteEntryUrl,
  entry.version
);
```

---

## 总结

**符合要求的项：**
- ✅ Registry 实现完整
- ✅ AI 生成组件验证通过

**需要立即修复的项：**
- ❌ Schema/Props 默认值注入（P0）
- ⚠️ 本地缓存未启用（P0）
- ❌ 复杂组件隔离性测试缺失（P1）

**建议：** 优先修复 P0 问题，确保符合第三阶段验收标准。

