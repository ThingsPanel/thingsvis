/**
 * 文本组件主入口 (Overlay 模板)
 * 
 * 📝 开发指南：
 * - Overlay 组件使用 createOverlay 而非 create
 * - 返回 { element, update, destroy } 对象
 * - element: DOM 容器元素
 * - update: 属性变化时调用
 * - destroy: 组件销毁时调用
 * 
 * 💡 提示：
 * - 使用 DOM 渲染可以显示在 Canvas 最上层
 * - 支持原生 CSS 样式和动画
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
  const defaults = getDefaultProps();
  return new Rect({
    width: 200,
    height: 40,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 应用样式到 DOM 元素
 */
function applyStyles(element: HTMLDivElement, props: Props) {
  element.textContent = props.text;
  element.style.color = props.fill;
  element.style.fontSize = `${props.fontSize}px`;
  element.style.fontWeight = props.fontWeight;
  element.style.textAlign = props.textAlign;
  element.style.fontFamily = props.fontFamily;
  element.style.backgroundColor = props.backgroundColor || 'transparent';
  element.style.padding = props.padding ? `${props.padding}px` : '0';
  element.style.lineHeight = props.lineHeight ? String(props.lineHeight) : '1.4';
  element.style.letterSpacing = props.letterSpacing ? `${props.letterSpacing}px` : 'normal';
  // Auto-size text: keep line breaks but do not auto-wrap.
  element.style.wordBreak = 'normal';
  element.style.whiteSpace = 'pre';
}

/**
 * 创建文本 Overlay 实例
 */
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  // 创建容器元素
  const element = document.createElement('div');
  // IMPORTANT:
  // - For resizable=false components, VisualEngine sets overlayBox to width/height:auto.
  // - Therefore the overlay root must be fit-content to let the content determine size.
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'flex-start';
  element.style.width = 'fit-content';
  element.style.height = 'fit-content';
  element.style.overflow = 'visible';
  element.style.pointerEvents = 'none'; // 允许点击穿透到 Canvas 进行选择
  element.style.userSelect = 'none';
  element.style.boxSizing = 'border-box';
  // hint for host-side auto-size implementations/debugging
  element.dataset.thingsvisOverlay = 'basic-text';
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  
  // 创建内部文本元素
  const textEl = document.createElement('div');
  textEl.style.width = 'fit-content';
  textEl.style.height = 'fit-content';
  textEl.style.boxSizing = 'border-box';
  textEl.dataset.thingsvisMeasure = '1';
  element.appendChild(textEl);
  
  // 应用初始样式
  applyStyles(textEl, currentProps);
  
  // 根据对齐方式调整 flex
  if (currentProps.textAlign === 'center') {
    element.style.justifyContent = 'center';
  } else if (currentProps.textAlign === 'right') {
    element.style.justifyContent = 'flex-end';
  }
  
  return {
    element,
    
    /**
     * 属性更新时调用
     */
    update: (newCtx: PluginOverlayContext) => {
      currentProps = { ...currentProps, ...(newCtx.props as Partial<Props>) };
      applyStyles(textEl, currentProps);
      
      // 更新对齐
      if (currentProps.textAlign === 'center') {
        element.style.justifyContent = 'center';
      } else if (currentProps.textAlign === 'right') {
        element.style.justifyContent = 'flex-end';
      } else {
        element.style.justifyContent = 'flex-start';
      }
    },
    
    /**
     * 组件销毁时调用
     */
    destroy: () => {
      // DOM 元素由宿主自动清理
    },
  };
}

/**
 * 插件主模块
 */
export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay,
};

export default Main;
