# ThingsVis 组件开发与数据源配置规范 (V2)

本指南旨在为开发者（包括 AI 助手）提供开发 ThingsVis 插件的严格标准。所有组件必须遵循此规范以确保在 ThingsVis 生态（Studio、Preview、Kernel）中正常运行。

## 1. 核心架构原则

- **驱动分离**：组件仅负责渲染（Dumb Component），逻辑与数据解析由 Kernel 层处理。
- **无样式类依赖**：禁止在 `packages/thingsvis-ui` 中编写样式，所有组件样式应在插件自身的 `src/styles.css` 中定义（支持 Tailwind）。
- **属性绑定**：组件属性支持 `{{ ds.id.data.path }}` 表达式，实现动态数据驱动。

## 2. 目录结构规范

每个组件插件必须位于 `plugins/[category]/[name]/` 目录下，结构如下：

```text
plugins/[category]/[name]/
├── src/
│   ├── index.tsx       # 1. 渲染入口：接收解析后的 props 进行展示
│   ├── spec.tsx        # 2. 元数据定义：包含组件 ID、名称、图标及 Zod 属性 Schema
│   ├── data.ts         # 3. 数据契约：定义默认数据绑定和演示用的 Mock 数据
│   └── styles.css      # 4. 样式文件：组件私有样式
├── assets/             # 5. 静态资源：组件使用的图标、图片、SVG
├── preview/            # 6. 预览资源：用于 Studio 组件库展示的缩略图 (thumbnail.png)
├── package.json        # 7. 模块配置：定义 Module Federation 导出入口
└── rspack.config.js    # 8. 编译配置：Rspack 构建脚本
```

## 3. 文件详细说明

### 3.1 `src/spec.tsx` (元数据与属性)
该文件定义了组件的“身份证”。
- **必须** 导出一个名为 `entry` 的对象。
- **必须** 使用 `zod` 定义 `schema`，以便 Studio 生成属性编辑表单。

### 3.2 `src/data.ts` (数据契约 - NEW)
该文件定义了组件如何与外部数据源联动。
- **`defaultDataBinding`**: 定义组件创建时默认绑定的属性。
- **`mockDataSource`**: 提供开发调试用的示例数据。

### 3.3 `src/index.tsx` (渲染逻辑)
接收经过 `Kernel` 解析后的属性。如果属性中包含 `{{ }}`，在到达此文件时已被替换为真实值。

---

## 4. AI 开发指令 (Prompting Guide)

如果你是 AI 助手，请遵循以下步骤创建组件：

1. **分析需求**：确定组件需要的可配置属性（如颜色、大小、文本内容）。
2. **定义 Schema**：在 `spec.tsx` 中编写 Zod 对象。
3. **建立绑定**：在 `data.ts` 中定义哪些属性默认应从数据源获取。
4. **实现渲染**：在 `index.tsx` 中编写 React 代码，使用 `leafer-ui` 或 `HTML/ECharts` 叠加层。

---

## 5. 标准案例：文本组件 (Text Component)

以下是符合规范的完整文本组件实现参考。

### 5.1 `src/spec.tsx` (元数据)
```tsx
import { z } from 'zod';
import { type PluginMainModule } from '@thingsvis/schema';

const TextPropsSchema = z.object({
  text: z.string().describe('文本内容'),
  fontSize: z.number().default(16).describe('字号'),
  fill: z.string().default('#000000').describe('颜色'),
});

export const entry: PluginMainModule = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '2.0.0',
  schema: TextPropsSchema,
};
```

### 5.2 `src/data.ts` (数据绑定)
```tsx
import { DataBinding, DataSource } from '@thingsvis/schema';

export const defaultDataBinding: DataBinding[] = [
  {
    targetProp: 'text',
    expression: '{{ ds.mock_text.data.text }}'
  }
];

export const mockDataSource: DataSource = {
  id: 'mock_text',
  type: 'STATIC',
  config: { value: { text: 'Hello Dynamic!' } }
};
```

### 5.3 `src/index.tsx` (渲染逻辑)
```tsx
import { Text } from 'leafer-ui';
import { entry } from './spec';

export function create() {
  return new Text({
    text: '占位', 
    fontSize: 16,
    draggable: true,
  });
}

export const Main = { ...entry, create };
export default Main;
```

