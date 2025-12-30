# ThingsVis 组件开发规范 (V3)

本指南为开发者（包括 AI 助手）提供开发 ThingsVis 插件的严格标准。

## 1. 核心架构原则

- **插件独立性**：插件禁止从 `@thingsvis/*` 包导入任何内容
- **驱动分离**：组件仅负责渲染（Dumb Component），逻辑与数据解析由 Kernel 层处理
- **属性绑定**：组件属性支持 `{{ ds.id.data.path }}` 表达式，实现动态数据驱动
- **Superset 风格**：优先提供结构化的「字段选择/映射」体验

## 2. 目录结构规范

```text
plugins/[category]/[name]/
├── src/
│   ├── index.ts      # 主入口：创建节点 + 导出 Main
│   ├── schema.ts     # ⭐ 属性定义：开发者重点关注
│   ├── metadata.ts   # 组件元数据：id/name/category/icon
│   ├── controls.ts   # 面板配置：分组/覆盖/绑定
│   └── lib/          # 📦 内部库（无需修改）
│       └── types.ts  # 类型定义和工具函数
├── README.md         # 组件文档
├── package.json      # 模块配置
├── rspack.config.js  # 编译配置
└── tsconfig.json     # TypeScript 配置
```

## 3. 文件职责说明

### 3.1 `src/schema.ts` ⭐ 开发者重点关注

使用 Zod 定义组件的所有可配置属性：

```typescript
import { z } from 'zod';

export const PropsSchema = z.object({
  // 内容属性（通常需要数据绑定）
  text: z.string().default('请输入文本').describe('文本内容'),
  
  // 样式属性
  fill: z.string().default('#000000').describe('文字颜色'),
  fontSize: z.number().min(1).max(999).default(16).describe('字号'),
  fontWeight: z.enum(['normal', 'bold']).default('normal').describe('字重'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
```

### 3.2 `src/metadata.ts` 组件元数据

```typescript
export const metadata = {
  id: 'basic-text',
  name: '基础文本',
  category: 'basic',
  icon: 'Type',
  version: '1.0.0',
} as const;
```

### 3.3 `src/controls.ts` 面板配置

```typescript
import { PropsSchema } from './schema';
import { generateControls } from './lib/types';

export const controls = generateControls(PropsSchema, {
  // 属性分组
  groups: {
    Content: ['text'],
    Style: ['fill', 'fontSize', 'fontWeight'],
  },
  // 覆盖控件类型
  overrides: {
    fill: { kind: 'color' },
  },
  // 数据绑定配置
  bindings: {
    text: { enabled: true, modes: ['static', 'field', 'expr'] },
    fill: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
```

### 3.4 `src/index.ts` 主入口

```typescript
import { Text } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps } from './schema';
import { controls } from './controls';
import type { PluginMainModule } from './lib/types';

function create(): Text {
  const defaults = getDefaultProps();
  return new Text({
    text: defaults.text,
    fontSize: defaults.fontSize,
    fill: defaults.fill,
    draggable: true,
    cursor: 'pointer',
  });
}

export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
};

export default Main;
```

### 3.5 `src/lib/types.ts` 内部类型（无需修改）

包含 `PluginMainModule` 类型定义和 `generateControls` 工具函数。
由模板生成，保证插件独立性。放在 `lib/` 目录下，开发者无需关注。

## 4. AI 开发指令

如果你是 AI 助手，请遵循以下步骤：

1. **分析需求**：确定组件需要的可配置属性
2. **定义 Schema**：在 `schema.ts` 中使用 Zod 定义属性
3. **配置面板**：在 `controls.ts` 中配置分组、控件类型、绑定
4. **实现渲染**：在 `index.ts` 中创建 Leafer UI 节点

## 5. 控件类型说明

| kind | 说明 | 适用场景 |
|------|------|----------|
| `string` | 文本输入 | 普通文本属性 |
| `number` | 数字输入 | 尺寸、位置等 |
| `boolean` | 开关 | 布尔标志 |
| `color` | 颜色选择器 | 颜色属性 |
| `select` | 下拉选择 | 枚举属性 |
| `json` | JSON 编辑器 | 复杂对象 |

## 6. 绑定模式说明

| mode | 说明 | 适用用户 |
|------|------|----------|
| `static` | 静态值输入 | 所有用户 |
| `field` | 从数据源字段选择 | 普通用户（Superset 风格） |
| `expr` | 表达式编辑器 | 高级用户 |
| `rule` | 条件规则 | 预留 |

## 7. 开发命令

```bash
# 创建新组件
pnpm vis-cli create <category> <name>

# 启动开发服务器
cd plugins/<category>/<name>
pnpm dev

# 类型检查
pnpm exec tsc --noEmit

# 构建
pnpm build
```

## 8. 组件分类

| 分类 | 说明 | 渲染方式 |
|------|------|----------|
| `basic` | 基础 UI 元素 | Leafer UI |
| `layout` | 布局容器 | Leafer Group |
| `media` | 图片、视频 | Leafer Image / Overlay |
| `chart` | 图表可视化 | DOM Overlay (ECharts) |
| `custom` | 自定义组件 | 混合 |
| `data` | 数据组件 | 无渲染 |
| `interaction` | 交互控件 | Leafer + 事件 |

