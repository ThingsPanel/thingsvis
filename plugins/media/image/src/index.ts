/**
 * 图片组件主入口 (Overlay 模板)
 * 
 * 使用 DOM Overlay 渲染图片
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 创建透明占位 Rect（用于 Leafer 层选择交互）
 */
function create(): Rect {
  return new Rect({
    width: 240,
    height: 240,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 应用样式到 DOM 元素
 */
function applyStyles(img: HTMLImageElement, container: HTMLDivElement, props: Props) {
  img.src = props.dataUrl || '';
  img.style.opacity = String(props.opacity);
  img.style.objectFit = props.objectFit;
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
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
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
  
  // 创建图片元素
  const img = document.createElement('img');
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.display = 'block';
  img.style.boxSizing = 'border-box';
  img.draggable = false;
  
  element.appendChild(img);
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  
  // 应用初始样式
  applyStyles(img, element, currentProps);
  
  return {
    element,
    update: (newCtx: PluginOverlayContext) => {
      currentProps = { ...defaults, ...(newCtx.props as Partial<Props>) };
      applyStyles(img, element, currentProps);
    },
    destroy: () => {
      img.src = '';
    },
  };
}

/**
 * 导出插件主模块
 */
const Main: PluginMainModule = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
