# @thingsvis/plugin-sdk

ThingsVis 插件开发 SDK，提供简洁的 API 和类型安全的开发体验。

## 安装

```bash
pnpm add @thingsvis/plugin-sdk
```

## 快速开始

### 方式一：definePlugin（推荐，傻瓜式）

```typescript
import { definePlugin } from '@thingsvis/plugin-sdk';
import { z } from 'zod';

export default definePlugin({
  id: 'my-chart',
  name: '我的图表',
  category: 'chart',
  icon: 'LineChart',

  schema: z.object({
    title: z.string().default('标题').describe('图表标题'),
    color: z.string().default('#1890ff').describe('颜色'),
    showLegend: z.boolean().default(true).describe('显示图例'),
  }),

  // 简化的分组配置
  controls: {
    Content: ['title'],
    Style: [
      { color: { kind: 'color', binding: true } },
      'showLegend',
    ],
  },

  // 一键开启所有绑定
  enableAllBindings: true,

  render: (el, props) => {
    // 渲染逻辑
    el.innerHTML = `<h1 style="color: ${props.color}">${props.title}</h1>`;
    
    return {
      update: (newProps) => {
        el.innerHTML = `<h1 style="color: ${newProps.color}">${newProps.title}</h1>`;
      },
      destroy: () => {
        el.innerHTML = '';
      },
    };
  },
});
```

### 方式二：createControlPanel（Builder Pattern，专家级）

```typescript
import { createControlPanel, generateControls } from '@thingsvis/plugin-sdk';

// Builder Pattern - 链式调用
export const controls = createControlPanel()
  .useStandardOptions(['opacity', 'shadow', 'border'])
  .addContentGroup((builder) => {
    builder
      .addTextInput('title', { label: '标题', binding: true })
      .addJsonEditor('data', { label: '数据', binding: true });
  })
  .addStyleGroup((builder) => {
    builder
      .addColorPicker('lineColor', { label: '线条颜色', binding: true })
      .addSwitch('smooth', { label: '平滑曲线' })
      .addSlider('lineWidth', { label: '线宽', min: 1, max: 10 })
      .addSelect('theme', {
        label: '主题',
        options: [
          { label: '默认', value: 'default' },
          { label: '暗黑', value: 'dark' },
        ],
      });
  })
  .build();
```

### 方式三：generateControls（传统方式）

```typescript
import { generateControls } from '@thingsvis/plugin-sdk';

export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['title'],
    Style: ['lineColor', 'smooth'],
  },
  overrides: {
    lineColor: { kind: 'color' },
  },
  bindings: {
    title: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
```

## Mixins - 可组合属性

```typescript
import { withMixins } from '@thingsvis/plugin-sdk';
import { z } from 'zod';

// 添加阴影和边框属性
const PropsSchema = withMixins(
  z.object({
    title: z.string().default('标题'),
  }),
  ['shadow', 'border']
);

// 结果包含：title, shadowEnabled, shadowColor, shadowBlur, borderWidth, borderColor...
```

可用 Mixins：
- `transform` - 缩放、倾斜、锚点
- `shadow` - 阴影
- `border` - 边框、圆角
- `background` - 背景色、背景图
- `text` - 字体大小、颜色、对齐
- `animation` - 入场动画

## 控件类型

| 类型 | 说明 | Builder 方法 |
|------|------|-------------|
| `string` | 文本输入 | `addTextInput()` |
| `number` | 数值输入 | `addNumberInput()` |
| `boolean` | 开关 | `addSwitch()` |
| `color` | 颜色选择 | `addColorPicker()` |
| `select` | 下拉选择 | `addSelect()` |
| `multiSelect` | 多选 | `addMultiSelect()` |
| `radio` | 单选组 | `addRadio()` |
| `segmented` | 分段控制 | `addSegmented()` |
| `slider` | 滑块 | `addSlider()` |
| `json` | JSON 编辑 | `addJsonEditor()` |
| `code` | 代码编辑 | `addCodeEditor()` |
| `image` | 图片选择 | `addImagePicker()` |
| `icon` | 图标选择 | `addIconPicker()` |
| `nodeSelect` | 节点选择 | `addNodeSelect()` |
| `dataSource` | 数据源选择 | `addDataSourceSelect()` |

## API 参考

### definePlugin(config)

一站式定义插件。

```typescript
type DefinePluginConfig<TProps> = {
  id: string;
  name: string;
  category?: 'basic' | 'chart' | 'media' | 'custom';
  icon?: string;
  version?: string;
  schema: z.ZodObject<TProps>;
  controls?: SimpleGroupConfig | PluginControls;
  enableAllBindings?: boolean;
  render: (el: HTMLElement, props: TProps) => {
    update?: (props: TProps) => void;
    destroy?: () => void;
  };
};
```

### createControlPanel()

创建 Builder Pattern 控件面板。

```typescript
createControlPanel()
  .useStandardOptions(['opacity', 'shadow'])
  .addGroup('Custom', (builder) => { ... })
  .build();
```

### generateControls(schema, config)

从 Zod Schema 生成控件配置。

```typescript
type GenerateControlsConfig = {
  groups?: Record<'Content' | 'Style' | 'Data' | 'Advanced', string[]>;
  overrides?: Record<string, Partial<ControlField>>;
  bindings?: Record<string, ControlBinding>;
  enableAllBindings?: boolean;
  exclude?: string[];
};
```
