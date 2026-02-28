export const metadata = {
    id: 'basic-switch',
    name: 'widget.switch.name',
    category: 'basic' as const,
    icon: 'ToggleRight',
    version: '1.0.0',
    description: '开关/切换器',
    defaultSize: { width: 60, height: 32 },
    constraints: { minWidth: 40, minHeight: 20 },
    locales: {
        zh: {
            'widget.switch.name': '开关',
            'widget.switch.value': '当前状态',
            'widget.switch.activeColor': 'props.activeColor',
            'widget.switch.inactiveColor': 'props.inactiveColor'
        },
        en: {
            'widget.switch.name': 'Switch',
            'widget.switch.value': 'Current State',
            'widget.switch.activeColor': 'Active Color',
            'widget.switch.inactiveColor': 'Inactive Color'
        }
    }
};
