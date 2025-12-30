# ECharts 折线图组件 (chart-echarts-line)

基于 ECharts 的折线图组件，支持数据绑定和样式配置。

## 文件结构

```
src/
├── index.ts      # 主入口：createOverlay + 导出 Main
├── schema.ts     # ⭐ 属性定义：开发者重点关注
├── metadata.ts   # 组件元数据
├── controls.ts   # 面板配置
└── lib/          # 📦 内部库（无需修改）
    └── types.ts  # 类型定义和工具函数
```

## Overlay 模板说明

与 Leafer 模板的区别：

| 特性 | Leafer 模板 | Overlay 模板 |
|------|-------------|--------------|
| 入口函数 | `create()` | `createOverlay()` |
| 返回值 | Leafer UI 节点 | `{ element, update, destroy }` |
| 渲染方式 | Canvas | DOM 容器 |
| 适用场景 | 基础图形 | ECharts/视频/3D |

## 开发指南

### 1. 定义属性 (`schema.ts`)

```typescript
export const PropsSchema = z.object({
  title: z.string().default('图表标题').describe('标题'),
  data: z.array(DataPointSchema).default([...]).describe('数据'),
  lineColor: z.string().default('#5470c6').describe('线条颜色'),
});
```

### 2. 实现 createOverlay (`index.ts`)

```typescript
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  // 1. 创建 DOM 容器
  const element = document.createElement('div');
  
  // 2. 初始化第三方库（ECharts/Three.js 等）
  const chart = echarts.init(element);
  
  return {
    element,
    
    // 3. 属性更新
    update: (newCtx) => {
      chart.setOption(buildOption(newCtx.props));
    },
    
    // 4. 销毁清理
    destroy: () => {
      chart.dispose();
    },
  };
}
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | '折线图' | 图表标题 |
| data | DataPoint[] | [...] | 数据系列 |
| lineColor | string | '#5470c6' | 线条颜色 |
| showArea | boolean | false | 是否显示区域填充 |
| smooth | boolean | true | 是否平滑曲线 |
| showSymbol | boolean | true | 是否显示数据点 |
| showLegend | boolean | false | 是否显示图例 |
| backgroundColor | string | '#ffffff' | 背景色 |

## 数据绑定

```
{{ ds.myDataSource.data.chartData }}
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 构建
pnpm build
```
