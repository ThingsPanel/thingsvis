# 文本组件 (basic-text)

基础文本组件，用于在画布上显示文本内容。

## 文件结构

```
src/
├── index.ts      # 主入口：defineWidget(...)
├── schema.ts     # ⭐ 属性定义：开发者重点关注
├── metadata.ts   # 组件元数据：id/name/category/icon
├── controls.ts   # 面板配置：分组/覆盖/绑定
└── lib/          # 📦 内部库（无需修改）
    └── types.ts  # 类型定义和工具函数
```

## 快速开始

### 1. 修改属性

编辑 `src/schema.ts`，添加或修改属性：

```typescript
export const PropsSchema = z.object({
  text: z.string().default('默认文本').describe('文本内容'),
  fontSize: z.number().default(16).describe('字号'),
  // 添加新属性...
});
```

### 2. 配置面板

编辑 `src/controls.ts`，调整属性面板：

```typescript
export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['text'],           // 内容分组
    Style: ['fill', 'fontSize'], // 样式分组
  },
  overrides: {
    fill: { kind: 'color' },     // 使用颜色选择器
  },
  bindings: {
    text: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
```

### 3. 更新渲染

编辑 `src/index.ts`，修改 `defineWidget({ render })`：

```typescript
export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  controls,
  locales: { zh, en },
  render: (element, props, ctx) => {
    // ...
  },
});
```

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm exec tsc --noEmit

# 构建
pnpm build
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | string | '' | 文本内容；为空时显示本地化预览占位文案 |
| fill | string | '#000000' | 文字颜色 |
| fontSize | number | 16 | 字号（像素） |
| fontWeight | 'normal' \| 'bold' | 'normal' | 字重 |
| textAlign | 'left' \| 'center' \| 'right' | 'left' | 对齐方式 |
| fontFamily | string | 'sans-serif' | 字体 |

## 数据绑定

以下属性支持数据绑定：

- `text` - 支持静态值、字段选择、表达式
- `fill` - 支持静态值、字段选择、表达式
- `fontSize` - 支持静态值、字段选择、表达式

绑定示例：
```
{{ ds.myDataSource.data.title }}
```
