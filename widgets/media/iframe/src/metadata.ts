export const metadata = {
    id: 'media-iframe',
    name: 'widget.iframe.name',
    category: 'media' as const,
    icon: 'AppWindow',
    version: '1.0.0',
    description: '网页容器',
    defaultSize: { width: 400, height: 300 },
    constraints: { minWidth: 100, minHeight: 80 },
    locales: {
        zh: {
            'widget.iframe.name': '网页容器',
            'widget.iframe.src': '网页地址',
            'widget.iframe.borderWidth': '边框宽度',
            'widget.iframe.borderColor': 'props.borderColor',
            'widget.iframe.borderRadius': '圆角半径'
        },
        en: {
            'widget.iframe.name': 'Iframe',
            'widget.iframe.src': 'URL',
            'widget.iframe.borderWidth': 'Border Width',
            'widget.iframe.borderColor': 'Border Color',
            'widget.iframe.borderRadius': 'Border Radius'
        }
    }
};
