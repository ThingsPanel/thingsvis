/**
 * Data Tag 组件 - 工业数据标签
 * 
 * 展示格式：[标签名] [数值] [单位]
 * 例如：瞬时流量 35.8 m³/h
 */

import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { 
  defineWidget, 
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext 
} from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

/**
 * 解析颜色（支持主题继承）
 */
function resolveColors(props: Props, colors: WidgetColors) {
  return {
    label: resolveLayeredColor({
      instance: props.labelColor,
      theme: colors.fg,
      fallback: colors.fg,
    }),
    value: resolveLayeredColor({
      instance: props.valueColor,
      theme: '#ff4d4f',
      fallback: '#ff4d4f',
    }),
    unit: resolveLayeredColor({
      instance: props.unitColor,
      theme: colors.fg,
      fallback: colors.fg,
    }),
    background: props.backgroundColor || 'rgba(0,0,0,0.3)',
    border: props.borderColor || 'transparent',
  };
}

/**
 * 获取对齐方式 CSS
 */
function getJustifyContent(align: Props['align']): string {
  switch (align) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'center':
    default: return 'center';
  }
}

/**
 * 渲染 Data Tag
 */
function renderDataTag(element: HTMLElement, props: Props, colors: WidgetColors) {
  const resolved = resolveColors(props, colors);
  
  // 计算字号
  const labelSize = props.fontSize;
  const valueSize = Math.round(props.fontSize * props.valueScale);
  const unitSize = Math.round(props.fontSize * props.unitScale);
  
  // 设置容器样式
  element.style.cssText = `
    display: inline-flex;
    flex-direction: ${props.layout === 'compact' ? 'column' : 'row'};
    align-items: center;
    justify-content: ${getJustifyContent(props.align)};
    gap: ${props.gap}px;
    padding: ${props.padding}px;
    background: ${resolved.background};
    border: 1px solid ${resolved.border};
    border-radius: ${props.borderRadius}px;
    width: fit-content;
    height: fit-content;
    font-family: inherit;
    box-sizing: border-box;
    white-space: nowrap;
  `;
  
  // 标签元素
  const labelEl = document.createElement('span');
  labelEl.textContent = props.label;
  labelEl.style.cssText = `
    font-size: ${labelSize}px;
    color: ${resolved.label};
    opacity: 0.85;
    flex-shrink: 0;
  `;
  
  // 数值元素
  const valueEl = document.createElement('span');
  valueEl.textContent = String(props.value);
  valueEl.style.cssText = `
    font-size: ${valueSize}px;
    color: ${resolved.value};
    font-weight: ${props.valueBold ? 'bold' : 'normal'};
    flex-shrink: 0;
  `;
  
  // 单位元素
  const unitEl = document.createElement('span');
  unitEl.textContent = props.unit;
  unitEl.style.cssText = `
    font-size: ${unitSize}px;
    color: ${resolved.unit};
    opacity: 0.75;
    flex-shrink: 0;
  `;
  
  // 清空并重新添加元素
  element.innerHTML = '';
  element.appendChild(labelEl);
  element.appendChild(valueEl);
  if (props.unit) {
    element.appendChild(unitEl);
  }
}

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
    // 设置容器基础样式
    element.style.display = 'inline-block';
    element.style.width = 'fit-content';
    element.style.height = 'fit-content';
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.dataset.thingsvisOverlay = 'industrial-data-tag';
    
    let currentProps = props;
    let currentCtx = ctx;
    let colors = resolveWidgetColors(element);
    
    // 初始渲染
    renderDataTag(element, currentProps, colors);
    
    // 监听主题变化
    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderDataTag(element, currentProps, colors);
      });
      themeObserver.observe(themeTarget, { 
        attributes: true, 
        attributeFilter: ['data-canvas-theme'] 
      });
    }
    
    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentCtx = nextCtx;
        colors = resolveWidgetColors(element);
        renderDataTag(element, currentProps, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
