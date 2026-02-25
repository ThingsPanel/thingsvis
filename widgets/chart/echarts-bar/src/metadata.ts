/**
 * ECharts 柱状图 — 组件元数据
 */

export const metadata = {
    id: 'chart-echarts-bar',
    name: 'ECharts 柱状图',
    category: 'chart',
    icon: 'BarChart3',
    version: '1.0.0',
    defaultSize: { width: 300, height: 200 },
    resizable: true,
    locales: {
        zh: {
            'widget.echarts-bar.name': 'ECharts 柱状图',
            'widget.echarts-bar.title': '图表标题',
            'widget.echarts-bar.primaryColor': '主色调',
            'widget.echarts-bar.data': '数据集',
            'widget.echarts-bar.showLegend': '显示图例'
        },
        en: {
            'widget.echarts-bar.name': 'ECharts Bar Chart',
            'widget.echarts-bar.title': 'Chart Title',
            'widget.echarts-bar.primaryColor': 'Primary Color',
            'widget.echarts-bar.data': 'Dataset',
            'widget.echarts-bar.showLegend': 'Show Legend'
        }
    }
} as const;
