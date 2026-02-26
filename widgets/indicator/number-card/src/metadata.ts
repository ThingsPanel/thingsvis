export const metadata = {
    id: 'indicator-number-card',
    name: 'widget.number-card.name',
    category: 'indicator' as const,
    icon: 'Hash',
    version: '1.0.0',
    description: '通用数值卡片',
    defaultSize: { width: 240, height: 120 },
    locales: {
        zh: {
            'widget.number-card.name': '数值卡片',
            'widget.number-card.title': 'props.title',
            'widget.number-card.value': 'props.value',
            'widget.number-card.unit': 'props.unit',
            'widget.number-card.valueColor': '数值颜色',
            'widget.number-card.titleColor': '标题颜色',
            'widget.number-card.backgroundColor': 'props.bgColor',
            'widget.number-card.borderRadius': '圆角半径'
        },
        en: {
            'widget.number-card.name': 'Number Card',
            'widget.number-card.title': 'Title',
            'widget.number-card.value': 'Value',
            'widget.number-card.unit': 'Unit',
            'widget.number-card.valueColor': 'Value Color',
            'widget.number-card.titleColor': 'Title Color',
            'widget.number-card.backgroundColor': 'Background Color',
            'widget.number-card.borderRadius': 'Border Radius'
        }
    }
};
