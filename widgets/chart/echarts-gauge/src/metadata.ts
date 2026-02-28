export const metadata = {
    id: 'chart-echarts-gauge',
    name: 'widget.echarts-gauge.name',
    category: 'chart' as const,
    icon: 'Gauge',
    version: '1.0.0',
    description: 'ECharts 仪表盘',
    defaultSize: { width: 300, height: 200 },
    constraints: { minWidth: 100, minHeight: 80 },
    locales: {
        zh: {
            'widget.echarts-gauge.name': '仪表盘',
            'widget.echarts-gauge.title': 'props.chartTitle',
            'widget.echarts-gauge.primaryColor': 'props.primaryColor',
            'widget.echarts-gauge.data': 'props.dataset',
            'widget.echarts-gauge.max': 'props.max'
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
