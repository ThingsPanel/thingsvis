import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    defaultSize: metadata.defaultSize,
    constraints: metadata.constraints,
    resizable: metadata.resizable,
    locales: { zh, en },
    schema: PropsSchema,
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;

        element.style.width = '100%';
        element.style.height = '100%';
        element.style.position = 'relative';
        element.style.overflow = 'hidden';

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.boxSizing = 'border-box';
        element.appendChild(iframe);

        const placeholder = document.createElement('div');
        placeholder.style.position = 'absolute';
        placeholder.style.inset = '0';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.padding = '16px';
        placeholder.style.boxSizing = 'border-box';
        placeholder.style.textAlign = 'center';
        placeholder.style.fontSize = '13px';
        placeholder.style.color = 'rgba(127, 127, 127, 0.9)';
        placeholder.style.border = '1px dashed rgba(127, 127, 127, 0.35)';
        placeholder.style.background = 'rgba(127, 127, 127, 0.06)';
        placeholder.style.pointerEvents = 'none';
        placeholder.innerHTML = '<div>请配置网页地址</div>';
        element.appendChild(placeholder);

        const updatePlaceholder = (state: 'empty' | 'loading' | 'error' | 'ready') => {
            if (state === 'ready') {
                placeholder.style.display = 'none';
                return;
            }

            placeholder.style.display = 'flex';
            if (state === 'loading') {
                placeholder.innerHTML = '<div>页面加载中</div>';
                return;
            }

            placeholder.innerHTML = state === 'error'
                ? '<div>页面加载失败</div>'
                : '<div>请配置网页地址</div>';
        };

        iframe.addEventListener('load', () => updatePlaceholder('ready'));
        iframe.addEventListener('error', () => updatePlaceholder('error'));

        const updateView = () => {
            const { src, borderWidth, borderColor, borderRadius } = currentProps;
            const rawSrc = src.trim();

            // Only update src if it changed to avoid reloading
            if (!rawSrc) {
                iframe.removeAttribute('src');
                updatePlaceholder('empty');
            } else {
                if (iframe.src !== rawSrc) {
                    updatePlaceholder('loading');
                    iframe.src = rawSrc;
                }
            }

            iframe.style.border = `${borderWidth}px solid ${borderColor}`;
            iframe.style.borderRadius = `${borderRadius}px`;
            iframe.style.boxSizing = 'border-box';
            element.style.borderRadius = `${borderRadius}px`;
        };

        updateView();

        return {
            update: (newProps: Props) => {
                currentProps = newProps;
                updateView();
            },
            destroy: () => {
                iframe.removeAttribute('src');
                element.innerHTML = '';
            },
        };
    }
});

export default Main;
