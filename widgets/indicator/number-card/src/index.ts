import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

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
        let colors: WidgetColors = resolveWidgetColors(element);

        element.style.width = '100%';
        element.style.height = '100%';
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.justifyContent = 'center';
        element.style.alignItems = 'center';
        element.style.boxSizing = 'border-box';
        element.style.overflow = 'hidden';

        const titleEl = document.createElement('div');
        const valueWrapper = document.createElement('div');
        const valueEl = document.createElement('span');
        const unitEl = document.createElement('span');

        valueWrapper.style.display = 'flex';
        valueWrapper.style.alignItems = 'baseline';

        valueWrapper.appendChild(valueEl);
        valueWrapper.appendChild(unitEl);

        element.appendChild(titleEl);
        element.appendChild(valueWrapper);

        const updateView = () => {
            const { title, value, unit, valueColor, titleColor, backgroundColor, borderRadius } = currentProps;

            // Use user-specified colors directly; no isDark override needed
            element.style.backgroundColor = backgroundColor;
            element.style.borderRadius = `${borderRadius}px`;

            titleEl.textContent = title;
            titleEl.style.color = titleColor;
            titleEl.style.fontSize = '14px';
            titleEl.style.marginBottom = '8px';

            valueEl.textContent = value !== undefined && value !== null ? String(value) : '--';
            valueEl.style.color = valueColor;
            valueEl.style.fontSize = '32px';
            valueEl.style.fontWeight = 'bold';

            unitEl.textContent = unit;
            unitEl.style.color = titleColor;
            unitEl.style.fontSize = '14px';
            unitEl.style.marginLeft = '4px';
        };

        updateView();

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                colors = resolveWidgetColors(element);
                updateView();
            },
            destroy: () => {
                element.innerHTML = '';
            },
        };
    }
});

export default Main;
