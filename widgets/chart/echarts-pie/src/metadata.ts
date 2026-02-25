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
            'widget.echarts-pie.title': '图表标题',
            'widget.echarts-pie.primaryColor': '主色调',
            'widget.echarts-pie.data': '数据集',
            'widget.echarts-pie.showLegend': '显示图例'
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
