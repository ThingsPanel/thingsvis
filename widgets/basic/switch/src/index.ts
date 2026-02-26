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
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';

        const track = document.createElement('div');
        const thumb = document.createElement('div');

        track.appendChild(thumb);
        element.appendChild(track);

        const updateView = () => {
            const { value, activeColor, inactiveColor } = currentProps;

            const finalInactiveColor = inactiveColor === '#d1d5db' && isDark ? '#374151' : inactiveColor;

            // Track styling
            track.style.width = '100%';
            track.style.height = '100%';
            track.style.borderRadius = '9999px';
            track.style.backgroundColor = value ? activeColor : finalInactiveColor;
            track.style.position = 'relative';
            track.style.transition = 'background-color 0.2s ease';
            track.style.boxSizing = 'border-box';
            track.style.padding = '2px';
            track.style.minWidth = '40px';
            track.style.minHeight = '20px';

            // Thumb styling
            thumb.style.height = '100%';
            thumb.style.aspectRatio = '1 / 1';
            thumb.style.backgroundColor = '#ffffff';
            thumb.style.borderRadius = '50%';
            thumb.style.position = 'absolute';
            thumb.style.top = '2px';
            thumb.style.bottom = '2px';
            thumb.style.left = value ? 'calc(100% - 2px)' : '2px';
            thumb.style.transform = value ? 'translateX(-100%)' : 'translateX(0)';
            thumb.style.transition = 'all 0.2s ease';
            thumb.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
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
