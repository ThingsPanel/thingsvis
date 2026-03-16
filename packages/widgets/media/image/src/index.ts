/**
 * 图片组件主入口 (Overlay 模板)
 * 
 * 使用 DOM Overlay 渲染图片
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

const localeCatalog = { zh, en } as const;
type WidgetLocale = keyof typeof localeCatalog;
type PlaceholderState = 'empty' | 'loading' | 'error' | 'ready';
type PlaceholderMessageKey = Exclude<PlaceholderState, 'ready'>;

function resolveLocalePack(locale: string | undefined) {
  const candidates = [
    locale,
    locale?.toLowerCase(),
    locale?.split(/[-_]/)[0]?.toLowerCase(),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (candidate in localeCatalog) {
      return localeCatalog[candidate as WidgetLocale];
    }
  }

  return localeCatalog.zh;
}

function getPlaceholderMessage(locale: string | undefined, key: PlaceholderMessageKey): string {
  return resolveLocalePack(locale).editor.widgets['thingsvis-widget-media-image'][key];
}


/**
 * 创建透明占位 Rect（用于 Leafer 层选择交互）
 */
function create(): Rect {
  return new Rect({
    width: metadata.defaultSize.width,
    height: metadata.defaultSize.height,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 应用样式到 DOM 元素
 */
function applyStyles(img: HTMLImageElement, container: HTMLDivElement, props: Props) {
  img.style.opacity = String(props.opacity);
  img.style.objectFit = props.objectFit;
  img.style.objectPosition = 'center';
  img.style.borderRadius = `${props.cornerRadius}px`;
  img.style.borderColor = props.borderColor;
  img.style.borderWidth = `${props.borderWidth}px`;
  img.style.borderStyle = props.borderWidth > 0 ? 'solid' : 'none';
  
  // Container styles
  container.style.borderRadius = `${props.cornerRadius}px`;
  container.style.overflow = 'hidden';
}

/**
 * 创建图片 Overlay 实例
 */
function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
  // 创建容器元素
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.pointerEvents = 'none';
  element.style.userSelect = 'none';
  element.style.boxSizing = 'border-box';
  element.dataset.thingsvisOverlay = 'media-image';
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.style.background = 'transparent';
  
  // 创建图片元素
  const img = document.createElement('img');
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.display = 'block';
  img.style.boxSizing = 'border-box';
  img.style.visibility = 'hidden';
  img.draggable = false;
  
  element.appendChild(img);

  const placeholder = document.createElement('div');
  placeholder.style.position = 'absolute';
  placeholder.style.inset = '0';
  placeholder.style.display = 'flex';
  placeholder.style.flexDirection = 'column';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.style.gap = '8px';
  placeholder.style.padding = '16px';
  placeholder.style.boxSizing = 'border-box';
  placeholder.style.border = '1px dashed rgba(127, 127, 127, 0.35)';
  placeholder.style.background = 'rgba(127, 127, 127, 0.06)';
  placeholder.style.color = 'rgba(127, 127, 127, 0.9)';
  placeholder.style.fontSize = '13px';
  placeholder.style.textAlign = 'center';
  placeholder.style.pointerEvents = 'none';
  const placeholderText = document.createElement('div');
  placeholderText.textContent = getPlaceholderMessage(ctx.locale, 'empty');
  placeholder.appendChild(placeholderText);
  element.appendChild(placeholder);
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  let currentLocale = ctx.locale;
  
  // 记录上一次的 dataUrl，用于检测变化
  let lastDataUrl = currentProps.dataUrl;
  let currentSrc = '';
  let loadRequestId = 0;
  let placeholderState: PlaceholderState = 'empty';

  const updatePlaceholder = (state: PlaceholderState) => {
    placeholderState = state;
    if (state === 'ready') {
      placeholder.style.display = 'none';
      return;
    }

    placeholder.style.display = 'flex';
    placeholderText.textContent = getPlaceholderMessage(currentLocale, state);
  };

  const clearDisplayedImage = () => {
    currentSrc = '';
    img.removeAttribute('src');
    img.style.visibility = 'hidden';
  };

  const beginImageLoad = (source: string) => {
    const normalizedSource = source.trim();
    currentSrc = normalizedSource;

    if (!normalizedSource) {
      loadRequestId += 1;
      clearDisplayedImage();
      updatePlaceholder('empty');
      return;
    }

    const requestId = ++loadRequestId;
    updatePlaceholder('loading');

    const probe = new Image();
    probe.onload = () => {
      if (requestId !== loadRequestId || currentSrc !== normalizedSource) {
        return;
      }

      img.src = normalizedSource;
      img.style.visibility = 'visible';
      updatePlaceholder('ready');
    };
    probe.onerror = () => {
      if (requestId !== loadRequestId || currentSrc !== normalizedSource) {
        return;
      }

      clearDisplayedImage();
      updatePlaceholder('error');
    };
    probe.src = normalizedSource;
  };
  
  // 应用初始样式
  applyStyles(img, element, currentProps);
  beginImageLoad(currentProps.dataUrl);
  
  return {
    element,
    update: (newCtx: WidgetOverlayContext) => {
      const newProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
      currentLocale = newCtx.locale;
      // 只在 dataUrl 变化时才更新 src（性能优化）
      const dataUrlChanged = newProps.dataUrl !== lastDataUrl;
      if (dataUrlChanged) {
        lastDataUrl = newProps.dataUrl;
      }
      currentProps = newProps;
      applyStyles(img, element, currentProps);
      if (dataUrlChanged) {
        beginImageLoad(currentProps.dataUrl);
      } else if (placeholderState !== 'ready') {
        updatePlaceholder(placeholderState);
      }
    },
    destroy: () => {
      loadRequestId += 1;
      clearDisplayedImage();
    },
  };
}

/**
 * 导出插件主模块
 */
const Main: WidgetMainModule = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
