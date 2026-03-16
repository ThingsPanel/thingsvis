import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

export const STANDALONE_DEFAULT_SRC = 'https://www.thingspanel.cn/';

type PlaceholderState = 'empty' | 'idle' | 'loading' | 'error' | 'ready';

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
    standaloneDefaults: {
        src: STANDALONE_DEFAULT_SRC,
    },
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let currentMode: WidgetOverlayContext['mode'] = ctx.mode;
        let currentSrc = '';

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
        iframe.loading = 'lazy';
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
        element.appendChild(placeholder);

        const placeholderCard = document.createElement('div');
        placeholderCard.style.display = 'flex';
        placeholderCard.style.flexDirection = 'column';
        placeholderCard.style.gap = '6px';
        placeholderCard.style.maxWidth = '100%';
        placeholderCard.style.alignItems = 'center';
        placeholderCard.style.justifyContent = 'center';
        placeholder.appendChild(placeholderCard);

        const placeholderTitle = document.createElement('div');
        placeholderTitle.style.fontWeight = '600';
        placeholderCard.appendChild(placeholderTitle);

        const placeholderDesc = document.createElement('div');
        placeholderDesc.style.opacity = '0.9';
        placeholderCard.appendChild(placeholderDesc);

        const placeholderUrl = document.createElement('div');
        placeholderUrl.style.fontSize = '12px';
        placeholderUrl.style.opacity = '0.75';
        placeholderUrl.style.wordBreak = 'break-all';
        placeholderCard.appendChild(placeholderUrl);

        const normalizeSource = (input: unknown): string => {
            const trimmed = typeof input === 'string' ? input.trim() : '';
            if (!trimmed) return '';
            try {
                return new URL(trimmed, window.location.href).href;
            } catch {
                return trimmed;
            }
        };

        const applyInteractionMode = () => {
            iframe.style.pointerEvents = currentMode === 'view' ? 'auto' : 'none';
        };

        const updatePlaceholder = (state: PlaceholderState, normalizedSrc: string) => {
            if (state === 'ready') {
                placeholder.style.display = 'none';
                return;
            }

            placeholder.style.display = 'flex';
            placeholderUrl.textContent = normalizedSrc;
            placeholderUrl.style.display = normalizedSrc ? 'block' : 'none';

            if (state === 'loading') {
                placeholderTitle.textContent = '页面加载中';
                placeholderDesc.textContent = '正在请求网页内容';
                return;
            }

            if (state === 'error') {
                placeholderTitle.textContent = '页面加载失败';
                placeholderDesc.textContent = '目标站点可能禁止嵌入或暂时不可用';
                return;
            }

            if (state === 'idle') {
                placeholderTitle.textContent = '网页已配置';
                placeholderDesc.textContent = currentMode === 'edit'
                    ? '编辑态默认不加载实时页面'
                    : '等待进入预览或运行态';
                return;
            }

            placeholderTitle.textContent = '请配置网页地址';
            placeholderDesc.textContent = '支持静态值、字段绑定或表达式';
        };

        const handleLoad = () => updatePlaceholder('ready', currentSrc);
        const handleError = () => updatePlaceholder('error', currentSrc);

        iframe.addEventListener('load', handleLoad);
        iframe.addEventListener('error', handleError);

        const updateView = () => {
            const { src, borderWidth, borderColor, borderRadius } = currentProps;
            const normalizedSrc = normalizeSource(src);
            const shouldLoadLivePage = Boolean(normalizedSrc);

            applyInteractionMode();

            if (!normalizedSrc) {
                currentSrc = '';
                iframe.removeAttribute('src');
                updatePlaceholder('empty', '');
            } else if (!shouldLoadLivePage) {
                currentSrc = '';
                iframe.removeAttribute('src');
                updatePlaceholder('idle', normalizedSrc);
            } else {
                const sourceChanged = currentSrc !== normalizedSrc;
                if (sourceChanged || iframe.getAttribute('src') !== normalizedSrc) {
                    currentSrc = normalizedSrc;
                    updatePlaceholder('loading', normalizedSrc);
                    iframe.src = normalizedSrc;
                }
            }

            iframe.style.border = `${borderWidth}px solid ${borderColor}`;
            iframe.style.borderRadius = `${borderRadius}px`;
            iframe.style.boxSizing = 'border-box';
            element.style.borderRadius = `${borderRadius}px`;
        };

        updateView();

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                currentMode = newCtx.mode;
                updateView();
            },
            destroy: () => {
                iframe.removeEventListener('load', handleLoad);
                iframe.removeEventListener('error', handleError);
                iframe.removeAttribute('src');
                element.innerHTML = '';
            },
        };
    }
});

export default Main;
