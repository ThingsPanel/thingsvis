export const metadata = {
    id: 'chart-uplot-line',
    name: 'widget.uplot-line.name',
    category: 'chart' as const,
    icon: 'LineChart',
    version: '1.0.0',
    description: '高性能时序图',
    defaultSize: { width: 400, height: 300 },
    locales: {
        zh: {
            'widget.uplot-line.name': '高性能时序图',
            'widget.uplot-line.title': 'props.chartTitle',
            'widget.uplot-line.primaryColor': 'props.primaryColor',
            'widget.uplot-line.data': 'props.dataset',
            'widget.uplot-line.showLegend': 'props.showLegend',
        },
        en: {
            'widget.uplot-line.name': 'uPlot Chart',
            'widget.uplot-line.title': 'Chart Title',
            'widget.uplot-line.primaryColor': 'Primary Color',
            'widget.uplot-line.data': 'Dataset',
            'widget.uplot-line.showLegend': 'Show Legend',
        }
    }
};
