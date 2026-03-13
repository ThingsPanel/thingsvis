/**
 * 组件元数据配置
 * 
 * 📝 开发指南：
 * - id: 组件唯一标识，格式为 "分类-名称"
 * - name: 组件显示名称
 * - category: 组件分类（chart）
 * - icon: Lucide 图标名称
 * - version: 版本号
 * - defaultSize: 组件的默认尺寸
 * - resizable: 是否支持手动调整尺寸
 */

export const metadata = {
  id: 'chart-echarts-line',
  name: 'ECharts 折线图',
  category: 'chart',
  icon: 'LineChart',
  version: '1.0.0',
  defaultSize: { width: 600, height: 220 },
  resizable: true, // 图表组件支持调整尺寸
  constraints: { minWidth: 100, minHeight: 80 },
} as const;
