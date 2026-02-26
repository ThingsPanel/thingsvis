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

        element.style.width = '100%';
        element.style.height = '100%';
        element.style.pointerEvents = 'auto'; // allow interaction with iframe

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        element.appendChild(iframe);

        const updateView = () => {
            const { src, borderWidth, borderColor, borderRadius } = currentProps;

            // Only update src if it changed to avoid reloading
            if (iframe.src !== src) {
                iframe.src = src;
            }

            iframe.style.border = `${borderWidth}px solid ${borderColor}`;
            iframe.style.borderRadius = `${borderRadius}px`;
            iframe.style.boxSizing = 'border-box';
        };

        updateView();

        return {
            update: (newProps: Props) => {
                currentProps = newProps;
                updateView();
            },
            destroy: () => {
                element.innerHTML = '';
            },
        };
    }
});

export default Main;
