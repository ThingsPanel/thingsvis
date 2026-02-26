export const metadata = {
    id: 'basic-table',
    name: 'widget.table.name',
    category: 'basic' as const,
    icon: 'Table2',
    version: '1.0.0',
    description: '数据表格',
    defaultSize: { width: 400, height: 300 },
    locales: {
        zh: {
            'widget.table.name': '表格',
            'widget.table.columns': '表头配置',
            'widget.table.data': '表格数据',
            'widget.table.headerBg': '表头背景色',
            'widget.table.headerColor': '表头文字颜色',
            'widget.table.rowBg': '行背景色',
            'widget.table.rowColor': '行文字颜色',
            'widget.table.borderColor': '边框颜色'
        },
        en: {
            'widget.table.name': 'Table',
            'widget.table.columns': 'Columns Config',
            'widget.table.data': 'Table Data',
            'widget.table.headerBg': 'Header Background',
            'widget.table.headerColor': 'Header Text Color',
            'widget.table.rowBg': 'Row Background',
            'widget.table.rowColor': 'Row Text Color',
            'widget.table.borderColor': 'Border Color'
        }
    }
};
