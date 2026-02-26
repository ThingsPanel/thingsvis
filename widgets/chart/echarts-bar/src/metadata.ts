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
            'widget.echarts-bar.title': 'props.chartTitle',
            'widget.echarts-bar.primaryColor': 'props.primaryColor',
            'widget.echarts-bar.data': 'props.dataset',
            'widget.echarts-bar.showLegend': 'props.showLegend'
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
