export const metadata = {
    id: 'basic-switch',
    name: 'widget.switch.name',
    category: 'basic' as const,
    icon: 'ToggleRight',
    version: '1.0.0',
    description: '开关/切换器',
    defaultSize: { width: 60, height: 32 },
    locales: {
        zh: {
            'widget.switch.name': '开关',
            'widget.switch.value': '当前状态',
            'widget.switch.activeColor': '开启颜色',
            'widget.switch.inactiveColor': '关闭颜色'
        },
        en: {
            'widget.switch.name': 'Switch',
            'widget.switch.value': 'Current State',
            'widget.switch.activeColor': 'Active Color',
            'widget.switch.inactiveColor': 'Inactive Color'
        }
    }
};
