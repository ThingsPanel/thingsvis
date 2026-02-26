export const metadata = {
    id: 'chart-echarts-gauge',
    name: 'widget.echarts-gauge.name',
    category: 'chart' as const,
    icon: 'Gauge',
    version: '1.0.0',
    description: 'ECharts 仪表盘',
    defaultSize: { width: 300, height: 200 },
    locales: {
        zh: {
            'widget.echarts-gauge.name': '仪表盘',
            'widget.echarts-gauge.title': '图表标题',
            'widget.echarts-gauge.primaryColor': '主色调',
            'widget.echarts-gauge.data': '数据集',
            'widget.echarts-gauge.max': '最大值'
        },
        en: {
            'widget.echarts-gauge.name': 'Gauge Chart',
            'widget.echarts-gauge.title': 'Chart Title',
            'widget.echarts-gauge.primaryColor': 'Primary Color',
            'widget.echarts-gauge.data': 'Dataset',
            'widget.echarts-gauge.max': 'Max Value'
        }
    }
};
