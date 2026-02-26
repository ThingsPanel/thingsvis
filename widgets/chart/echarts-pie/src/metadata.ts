/**
 * ECharts 饼图 — 组件元数据
 */

export const metadata = {
    id: 'chart-echarts-pie',
    name: 'ECharts 饼图',
    category: 'chart',
    icon: 'PieChart',
    version: '1.0.0',
    defaultSize: { width: 300, height: 200 },
    resizable: true,
    locales: {
        zh: {
            'widget.echarts-pie.name': 'ECharts 饼图',
            'widget.echarts-pie.title': 'props.chartTitle',
            'widget.echarts-pie.primaryColor': 'props.primaryColor',
            'widget.echarts-pie.data': 'props.dataset',
            'widget.echarts-pie.showLegend': 'props.showLegend'
        },
        en: {
            'widget.echarts-pie.name': 'ECharts Pie Chart',
            'widget.echarts-pie.title': 'Chart Title',
            'widget.echarts-pie.primaryColor': 'Primary Color',
            'widget.echarts-pie.data': 'Dataset',
            'widget.echarts-pie.showLegend': 'Show Legend'
        }
    }
} as const;
