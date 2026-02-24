/**
 * 文本组件主入口 (Overlay 模板)
 * 
 * 📝 使用 @thingsvis/widget-sdk 重构
 * 
 * 支持属性：
 * - 字体：fontSize, fontFamily, fontWeight, fontStyle
 * - 排版：textAlign, verticalAlign, lineHeight, letterSpacing, textDecoration
 * - 颜色：fill, backgroundColor, opacity
 * - 阴影：textShadow*
 * - 边框：borderWidth, borderColor, borderStyle, borderRadius, padding
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from './lib/types';

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
  // 内容
  element.textContent = props.text;
  
  // 字体属性
  element.style.fontSize = `${props.fontSize}px`;
  element.style.fontFamily = props.fontFamily;
  element.style.fontWeight = props.fontWeight;
  element.style.fontStyle = props.fontStyle;
  
  // 排版属性
  element.style.textAlign = props.textAlign;
  element.style.lineHeight = String(props.lineHeight);
  element.style.letterSpacing = props.letterSpacing ? `${props.letterSpacing}px` : 'normal';
  element.style.textDecoration = props.textDecoration;
  
  // 颜色属性
  element.style.color = props.fill;
  element.style.backgroundColor = props.backgroundColor || 'transparent';
  element.style.opacity = String(props.opacity);
  
  // 阴影属性
  if (props.textShadowEnabled) {
    element.style.textShadow = `${props.textShadowOffsetX}px ${props.textShadowOffsetY}px ${props.textShadowBlur}px ${props.textShadowColor}`;
  } else {
    element.style.textShadow = 'none';
  }
  
  // 其他属性
  element.style.padding = props.padding ? `${props.padding}px` : '0';
  
  // 文本换行模式（默认支持换行）
  element.style.wordBreak = 'break-word';
  element.style.whiteSpace = 'pre-wrap';
}

/**
 * 获取 flex 对齐方式
 */
function getFlexAlign(align: Props['textAlign']): string {
  switch (align) {
    case 'center': return 'center';
    case 'right': return 'flex-end';
    case 'justify': return 'space-between';
    default: return 'flex-start';
  }
}

function getVerticalAlign(align: Props['verticalAlign']): string {
  switch (align) {
    case 'middle': return 'center';
    case 'bottom': return 'flex-end';
    default: return 'flex-start';
  }
}

/**
 * 创建文本 Overlay 实例
 */
function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
  // 创建容器元素
  const element = document.createElement('div');
  element.style.display = 'inline-flex';
  element.style.width = 'fit-content';
  element.style.height = 'fit-content';
  element.style.overflow = 'visible';
  element.style.pointerEvents = 'none';
  element.style.userSelect = 'none';
  element.style.boxSizing = 'border-box';
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
  element.style.justifyContent = getFlexAlign(currentProps.textAlign);
  element.style.alignItems = getVerticalAlign(currentProps.verticalAlign);
  
  return {
    element,
    
    /**
     * 属性更新时调用
     */
    update: (newCtx: WidgetOverlayContext) => {
      currentProps = { ...currentProps, ...(newCtx.props as Partial<Props>) };
      applyStyles(textEl, currentProps);
      element.style.justifyContent = getFlexAlign(currentProps.textAlign);
      element.style.alignItems = getVerticalAlign(currentProps.verticalAlign);
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
export const Main: WidgetMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay,
};

export default Main;
