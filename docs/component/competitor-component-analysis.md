# 竞品深度分析报告：可视化组件开发体系对比

## 📊 一、竞品概览对比表

| 维度 | ThingsBoard | Superset | Grafana | DataV | ThingsVis (当前) |
|------|-------------|----------|---------|-------|-----------------|
| **开发SDK完整度** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **配置简单度** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **傻瓜式上手** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **高级扩展性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **调试体验** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

---

## 📌 二、ThingsBoard 组件设计分析

### 1. 架构特点

```
Widget Definition
├── HTML Template       → 静态 HTML 结构
├── CSS Styles          → 样式定义
├── JavaScript Code     → Widget API 实现
├── Settings Schema     → JSON Schema 配置
└── Data Key Schema     → 数据源绑定配置
```

### 2. 优点
- **JSON Schema 驱动面板生成**：使用 `react-schema-form` 自动生成 UI
- **5种标准 Widget 类型**：Latest Values, Time Series, Control, Alarm, Static
- **数据源类型丰富**：Device, Entity, Alarm, Function (调试)

### 3. 缺点
- **配置复杂**：JSON Schema 格式繁琐，学习曲线陡峭
- **开发体验差**：需要在网页编辑器中编写代码，无本地 IDE 支持
- **热重载困难**：修改后需要手动点击 Run

### 4. 面板配置示例
```json
{
  "schema": {
    "type": "object",
    "properties": {
      "cardType": { "title": "Card type", "type": "string", "default": "Average" },
      "cardTitle": { "title": "Card title", "type": "string" }
    }
  },
  "form": [
    { "key": "cardType", "type": "rc-select", "items": [...] },
    "cardTitle"
  ]
}
```

---

## 📌 三、Apache Superset 组件设计分析

### 1. 架构特点

```
Viz Plugin Package
├── src/
│   ├── index.ts              → 入口导出
│   ├── plugin/
│   │   ├── index.ts          → Plugin 定义
│   │   ├── controlPanel.ts   → ⭐ 控制面板配置
│   │   ├── transformProps.ts → 数据转换
│   │   └── buildQuery.ts     → 查询构建
│   └── MyChart.tsx           → React 组件
```

### 2. 核心亮点：Control Panel 设计

```typescript
// Superset 的 controlPanel.tsx
export default {
  controlPanelSections: [
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [
        ['metrics'],
        ['groupby'],
        ['row_limit'],
      ],
    },
    {
      label: 'Chart Options',
      expanded: true,
      controlSetRows: [
        [{ name: 'color_scheme', config: { renderTrigger: true } }],
        ['show_legend'],
      ],
    },
  ],
  // 共享控件复用
  controlOverrides: {
    series: { mapStateToProps: (state) => ({ ... }) },
  },
};
```

### 3. 控件类型系统

```typescript
// Superset 的 BaseControlConfig
interface BaseControlConfig<T, O, V> {
  type: T;                           // 控件类型
  label?: ReactNode;                 // 标签
  description?: ReactNode;           // 描述
  default?: V;                       // 默认值
  renderTrigger?: boolean;           // 是否触发重渲染
  validators?: ControlValueValidator[];  // 验证器
  mapStateToProps?: Function;        // 状态映射
  visibility?: Function;             // 条件显示
}
```

### 4. 优点
- **Sections + ControlSetRows 分层设计**：清晰的配置层级
- **共享控件机制**：大量预置控件可直接复用
- **状态响应式**：`mapStateToProps` 支持控件联动
- **Yeoman 脚手架**：`yo @superset-ui/superset` 一键生成

### 5. 缺点
- **React 强耦合**：控件配置与 React 紧密绑定
- **配置分散**：需要在多个文件间切换
- **调试流程长**：需要打包到 npm 再安装

---

## 📌 四、Grafana 组件设计分析

### 1. 架构特点 - 最成熟的方案

```
Panel Plugin
├── plugin.json           → 元数据声明
├── src/
│   ├── module.ts         → ⭐ 入口 + 配置构建器
│   ├── types.ts          → 类型定义
│   └── components/
│       └── Panel.tsx     → 组件实现
└── panelcfg.cue          → CUE Schema (可选)
```

### 2. 核心亮点：Builder Pattern 配置

```typescript
// Grafana 的 module.ts
export const widget = new PanelPlugin<Options, FieldConfig>(TablePanel)
  .setPanelChangeHandler(tablePanelChangedHandler)
  .setMigrationHandler(tableMigrationHandler)
  .useFieldConfig({
    standardOptions: {
      [FieldConfigProperty.Actions]: { hideFromDefaults: false },
    },
    useCustomConfig: (builder) => {
      builder
        .addNumberInput({
          path: 'fontSize',
          name: 'Font size',
          defaultValue: 14,
        })
        .addColorPicker({
          path: 'color',
          name: 'Text color',
          defaultValue: '#000',
        })
        .addRadio({
          path: 'align',
          name: 'Alignment',
          settings: {
            options: [
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ],
          },
        });
    },
  })
  .setPanelOptions((builder) => {
    builder
      .addBooleanSwitch({
        path: 'showHeader',
        name: 'Show table header',
        defaultValue: true,
      });
  });
```

### 3. 类型自动生成 (CUE Schema)

```cue
// panelcfg.cue
composableKinds: PanelCfg: {
  lineage: {
    schemas: [{
      version: [0, 0]
      schema: {
        Options: {
          frameIndex: number | *0
          showHeader: bool | *true
          cellHeight: "sm" | "md" | "lg" | *"sm"
        }
      }
    }]
  }
}
```

### 4. 优点
- **Builder Pattern**：链式调用，IDE 友好，自动补全
- **标准控件库**：`addNumberInput`, `addColorPicker`, `addRadio` 等
- **Field Config 分离**：面板选项 vs 字段配置清晰分开
- **Docker Compose 开发环境**：`docker compose up` 即可调试
- **CUE Schema**：类型安全，自动生成 TypeScript 类型

### 5. 缺点
- **框架较重**：需要完整的 Grafana 环境
- **Angular 遗留**：部分旧 API 仍有 Angular 痕迹

---

## 📌 五、DataV 组件设计分析

### 1. 架构特点

```
Component Package
├── package.json
├── options.json          → ⭐ 配置项定义
├── index.js              → 渲染逻辑
├── data.json             → 默认数据
└── thumbnail.png         → 缩略图
```

### 2. 配置文件结构 (options.json)

```json
{
  "type": "basic-bar",
  "name": "基础柱状图",
  "configuration": {
    "global": {
      "title": { "type": "string", "default": "标题" },
      "margin": {
        "type": "object",
        "properties": {
          "top": { "type": "number", "default": 10 }
        }
      }
    },
    "series": {
      "color": { "type": "color", "default": "#1890ff" }
    }
  }
}
```

### 3. 优点
- **纯配置驱动**：完全 JSON 化
- **可视化编辑器**：CDK 工具链支持

### 4. 缺点
- **闭源限制**：核心 CDK 非开源
- **文档不全**：组件开发文档较少

---

## 🎯 六、ThingsVis 当前设计分析

### 1. 当前架构

```
Plugin Package
├── src/
│   ├── index.ts          → createOverlay + Main 导出
│   ├── schema.ts         → ⭐ Zod Schema 属性定义
│   ├── controls.ts       → ⭐ 面板配置
│   ├── metadata.ts       → 组件元数据
│   └── lib/
│       └── types.ts      → 类型 + generateControls 工具
```

### 2. 当前配置方式

```typescript
// schema.ts - Zod 定义
export const PropsSchema = z.object({
  title: z.string().default('标题').describe('图表标题'),
  lineColor: z.string().default('#5470c6').describe('线条颜色'),
});

// controls.ts - 面板配置
export const controls = generateControls(PropsSchema, {
  groups: {
    Content: ['title'],
    Style: ['lineColor'],
  },
  overrides: {
    lineColor: { kind: 'color' },
  },
  bindings: {
    title: { enabled: true, modes: ['static', 'field', 'expr'] },
  },
});
```

### 3. 当前优点
- **Zod Schema 自动推导**：从 Schema 自动生成控件
- **React-free 架构**：Schema 层不依赖 React
- **Module Federation**：热加载支持

### 4. 当前痛点
- **lib/types.ts 重复**：每个插件都复制一份工具函数
- **控件类型有限**：仅 string/number/boolean/color/select/json
- **缺少预置属性**：通用属性（位置、旋转、缩放）需手动处理
- **调试体验一般**：debugSource 切换需手动配置

---

## 🚀 七、改进建议

### 1. SDK 层面 - 让开发者只关注核心

#### 1.1 创建 `@thingsvis/widget-sdk` 包

```typescript
// 开发者只需：
import { defineWidget, createOverlay } from '@thingsvis/widget-sdk';

export default defineWidget({
  id: 'chart-echarts-line',
  name: '折线图',
  category: 'chart',
  
  // ⭐ 自动处理：画布交互、拖拽、缩放、选中框
  schema: z.object({
    title: z.string().default('标题'),
    data: z.array(DataPointSchema).default([...]),
  }),
  
  // ⭐ 简化的 controls 声明
  controls: {
    'Content': ['title'],
    'Data': ['data'],
    'Style': {
      lineColor: { kind: 'color', binding: true },
    },
  },
  
  // 只关注渲染
  render: (el, props) => {
    const chart = echarts.init(el);
    chart.setOption(buildOption(props));
    return { update: (p) => chart.setOption(buildOption(p)), dispose: () => chart.dispose() };
  },
});
```

#### 1.2 预置通用属性系统

```typescript
// SDK 内置 BaseProps
const BasePropsSchema = z.object({
  // 🔒 系统属性 - 自动管理，用户不可见
  _x: z.number().default(0),
  _y: z.number().default(0),
  _width: z.number().default(200),
  _height: z.number().default(150),
  _rotation: z.number().default(0),
  _opacity: z.number().min(0).max(1).default(1),
  _locked: z.boolean().default(false),
  
  // 📦 可选内置属性 - 通过 mixins 引入
  // ...TransformMixin, ...ShadowMixin, ...BorderMixin
});

// 开发者继承
export const PropsSchema = BasePropsSchema.extend({
  // 只定义组件特有属性
  title: z.string().default('标题'),
});
```

### 2. 面板配置系统 - 分层设计

#### 2.1 三层配置架构

```
┌─────────────────────────────────────────────────┐
│  Layer 1: System Properties (自动/隐藏)          │
│  位置、尺寸、旋转、不透明度、锁定                 │
├─────────────────────────────────────────────────┤
│  Layer 2: Common Properties (可选引入)           │
│  边框、阴影、圆角、背景 (Mixins)                 │
├─────────────────────────────────────────────────┤
│  Layer 3: Custom Properties (开发者定义)         │
│  组件特有属性                                    │
└─────────────────────────────────────────────────┘
```

#### 2.2 Builder Pattern 配置 (借鉴 Grafana)

```typescript
// 新的配置方式
export const controls = createControlPanel()
  // 自动引入通用属性组
  .useStandardOptions(['opacity', 'shadow', 'border'])
  
  // 自定义属性组
  .addGroup('Content', (builder) => {
    builder
      .addTextInput('title', { label: '标题', binding: true })
      .addJsonEditor('data', { label: '数据', binding: true });
  })
  
  .addGroup('Style', (builder) => {
    builder
      .addColorPicker('lineColor', { label: '线条颜色', binding: true })
      .addSwitch('smooth', { label: '平滑曲线' })
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

### 3. 调试体验提升

#### 3.1 Plugin DevTools

```typescript
// 开发模式自动注入
if (process.env.NODE_ENV === 'development') {
  window.__THINGSVIS_DEVTOOLS__ = {
    // 实时查看 props
    inspectProps: (nodeId) => { ... },
    // 强制刷新组件
    forceUpdate: (nodeId) => { ... },
    // 切换数据源模式
    mockData: (schema) => { ... },
  };
}
```

#### 3.2 CLI 工具增强

```bash
# 创建新组件 - 交互式选择
pnpm vis-cli create
? 组件类型: (chart/basic/media/custom)
? 组件名称: my-chart
? 使用模板: (leafer/overlay/react)
? 内置属性: (opacity/shadow/border)

# 启动开发服务器 - 自动注册
pnpm vis-cli dev my-chart
# → 自动更新 registry.json
# → 自动打开 Studio + 添加测试组件

# 发布组件
pnpm vis-cli publish my-chart
```

### 4. 控件类型扩展

```typescript
// 扩展 ControlKind
type ControlKind =
  // 基础
  | 'string' | 'number' | 'boolean'
  // 颜色
  | 'color' | 'gradient' | 'colorScheme'
  // 选择
  | 'select' | 'multiSelect' | 'radio' | 'segmented'
  // 复杂
  | 'json' | 'code' | 'expression'
  // 特殊
  | 'image' | 'icon' | 'font'
  // 数据
  | 'dataField' | 'dataSource' | 'nodeSelect'
  // 布局
  | 'slider' | 'rangeSlider' | 'margin' | 'padding';
```

### 5. 数据绑定简化 (借鉴 Superset)

```typescript
// 简化版绑定配置
export const controls = generateControls(PropsSchema, {
  // 傻瓜模式：一键开启所有绑定
  enableAllBindings: true,
  
  // 或精细控制
  bindings: {
    // 简写：默认支持 static + field
    title: true,
    
    // 完整写法
    data: {
      enabled: true,
      modes: ['static', 'field', 'expr'],
      // 新增：字段类型提示
      fieldType: 'array',
      // 新增：表达式模板
      exprTemplate: '{{ ds.${dataSourceId}.data.${fieldPath} }}',
    },
  },
});
```

---

## 📋 八、实施路线图

### Phase 1: SDK 基础 (2周)

- [ ] 创建 `@thingsvis/widget-sdk` 包
- [ ] 实现 `defineWidget()` 简化入口
- [ ] 抽取 `generateControls` 到公共包
- [ ] 预置 BasePropsSchema

### Phase 2: 面板系统 (2周)

- [ ] 实现 Builder Pattern API
- [ ] 扩展控件类型
- [ ] 实现 standardOptions 机制

### Phase 3: 开发体验 (1周)

- [ ] 增强 vis-cli create 命令
- [ ] 实现 vis-cli dev 热调试
- [ ] 添加 DevTools 面板

### Phase 4: 文档完善 (1周)

- [ ] 组件开发快速入门
- [ ] API 参考文档
- [ ] 最佳实践示例

---

## 💡 九、总结

| 竞品 | 学习要点 |
|------|---------|
| **Grafana** | Builder Pattern + CUE Schema + Docker 开发环境 |
| **Superset** | ControlPanel Sections + 共享控件 + Yeoman 脚手架 |
| **ThingsBoard** | JSON Schema 驱动 + 多数据源类型 |

**ThingsVis 的差异化方向**：
1. **Zod-first**：利用 Zod 的类型推导和校验能力
2. **React-free Schema**：保持 Schema 层的纯粹性
3. **傻瓜 + 专家双模式**：`enableAllBindings: true` vs 精细配置
4. **Module Federation**：保持热加载优势
