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
  defaultSize: { width: 300, height: 200 },
  resizable: true, // 图表组件支持调整尺寸
  constraints: { minWidth: 100, minHeight: 80 },
  locales: {
    zh: {
      'widget.echarts-line.name': 'ECharts 折线图',
      'widget.echarts-line.title': 'props.chartTitle',
      'widget.echarts-line.primaryColor': 'props.primaryColor',
      'widget.echarts-line.data': 'props.dataset',
      'widget.echarts-line.showLegend': 'props.showLegend',
      'widget.echarts-line.smooth': 'props.smoothCurve',
      'widget.echarts-line.showArea': '显示阴影面积'
    },
    en: {
      'widget.echarts-line.name': 'ECharts Line Chart',
      'widget.echarts-line.title': 'Chart Title',
      'widget.echarts-line.primaryColor': 'Primary Color',
      'widget.echarts-line.data': 'Dataset',
      'widget.echarts-line.showLegend': 'Show Legend',
      'widget.echarts-line.smooth': 'Smooth Curve',
      'widget.echarts-line.showArea': 'Show Area Shadow'
    }
  }
} as const;
