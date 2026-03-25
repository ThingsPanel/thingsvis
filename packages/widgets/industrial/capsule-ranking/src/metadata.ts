/**
 * 胶囊排行榜组件 - 元数据配置
 * 
 * 水平胶囊条形图，支持排名展示
 * 参考：DataV 的 dv-capsule-chart
 */

export const metadata = {
  id: 'industrial-capsule-ranking',
  name: '胶囊排行榜',
  category: 'industrial',
  icon: 'BarChart3',
  version: '1.0.0',
  order: 3,
  resizable: true,
  defaultSize: { width: 300, height: 200 },
  constraints: { minWidth: 150, minHeight: 100 },
} as const;
