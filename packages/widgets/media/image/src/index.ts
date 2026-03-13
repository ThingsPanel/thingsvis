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
 * @param skipSrc - 如果为 true，跳过更新 img.src（用于性能优化）
 */
function applyStyles(img: HTMLImageElement, container: HTMLDivElement, props: Props, skipSrc = false) {
  if (!skipSrc) {
    img.src = props.dataUrl || '';
  }
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
  placeholder.innerHTML = `<div>请配置图片</div>`;
  element.appendChild(placeholder);
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  
  // 记录上一次的 dataUrl，用于检测变化
  let lastDataUrl = currentProps.dataUrl;

  const updatePlaceholder = (state: 'empty' | 'loading' | 'error' | 'ready') => {
    if (state === 'ready') {
      placeholder.style.display = 'none';
      return;
    }

    placeholder.style.display = 'flex';
    if (state === 'loading') {
      placeholder.innerHTML = '<div>图片加载中</div>';
      return;
    }

    placeholder.innerHTML = state === 'error'
      ? '<div>图片加载失败</div>'
      : '<div>请配置图片</div>';
  };

  img.addEventListener('load', () => updatePlaceholder('ready'));
  img.addEventListener('error', () => updatePlaceholder('error'));
  
  // 应用初始样式
  applyStyles(img, element, currentProps);
  updatePlaceholder(currentProps.dataUrl ? 'loading' : 'empty');
  
  return {
    element,
    update: (newCtx: WidgetOverlayContext) => {
      const newProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
      // 只在 dataUrl 变化时才更新 src（性能优化）
      const dataUrlChanged = newProps.dataUrl !== lastDataUrl;
      if (dataUrlChanged) {
        lastDataUrl = newProps.dataUrl;
      }
      currentProps = newProps;
      applyStyles(img, element, currentProps, !dataUrlChanged);
      if (dataUrlChanged && currentProps.dataUrl) {
        updatePlaceholder('loading');
      } else if (!currentProps.dataUrl) {
        updatePlaceholder('empty');
      }
    },
    destroy: () => {
      img.src = '';
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
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
