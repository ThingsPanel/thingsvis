import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    locales: metadata.locales,
    schema: PropsSchema,
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let isDark = (ctx as any).theme?.isDark ?? false;

        element.style.width = '100%';
        element.style.height = '100%';
        element.style.overflow = 'auto'; // scrollable table

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        element.appendChild(table);

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);

        const updateView = () => {
            const { columns, data, headerBg, headerColor, rowBg, rowColor, borderColor } = currentProps;

            const finalHeaderBg = headerBg === '#f3f4f6' && isDark ? '#141414' : headerBg;
            const finalHeaderColor = headerColor === '#374151' && isDark ? '#d1d5db' : headerColor;
            const finalRowBg = rowBg === '#ffffff' && isDark ? '#1f1f1f' : rowBg;
            const finalRowColor = rowColor === '#1f2937' && isDark ? '#e5e7eb' : rowColor;
            const finalBorderColor = borderColor === '#e5e7eb' && isDark ? '#374151' : borderColor;

            thead.innerHTML = '';
            tbody.innerHTML = '';

            // Header
            const trHead = document.createElement('tr');
            (columns || []).forEach((col: any) => {
                const th = document.createElement('th');
                th.textContent = col.title || col.key;
                th.style.backgroundColor = finalHeaderBg;
                th.style.color = finalHeaderColor;
                th.style.padding = '8px 12px';
                th.style.borderBottom = `1px solid ${finalBorderColor}`;
                th.style.textAlign = 'left';
                th.style.fontWeight = '600';
                th.style.fontSize = '14px';
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);

            // Body
            (data || []).forEach((row: any) => {
                const tr = document.createElement('tr');
                tr.style.backgroundColor = finalRowBg;

                (columns || []).forEach((col: any) => {
                    const td = document.createElement('td');
                    td.textContent = row[col.key] !== undefined ? String(row[col.key]) : '';
                    td.style.color = finalRowColor;
                    td.style.padding = '8px 12px';
                    td.style.borderBottom = `1px solid ${finalBorderColor}`;
                    td.style.fontSize = '14px';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        };

        updateView();

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                isDark = (newCtx as any).theme?.isDark ?? false;
                updateView();
            },
            destroy: () => {
                element.innerHTML = '';
            },
        };
    }
});

export default Main;
