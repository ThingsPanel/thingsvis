import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

function renderSlider(element: HTMLElement, props: Props, colors: WidgetColors, emit?: (event: string, data: unknown) => void): () => void {
  const textPrimary = colors.fg;
  const textSecondary = colors.fg + '99'; // 60% opacity
  const trackColor = colors.primary || '#3b82f6';
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  `;
  
  const labelHtml = props.label || props.showValue ? `
    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    ">
      <span style="
        font-size: 13px;
        color: ${textPrimary};
        font-weight: 500;
      ">${props.label}</span>
      ${props.showValue ? `
        <span style="
          font-size: 13px;
          color: ${textPrimary};
          font-weight: 600;
        ">${props.value.toFixed(props.step < 1 ? 2 : 0)}${props.unit ? ' ' + props.unit : ''}</span>
      ` : ''}
    </div>
  ` : '';
  
  element.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 8px 12px;
      box-sizing: border-box;
    ">
      ${labelHtml}
      <input 
        type="range"
        min="${props.min}"
        max="${props.max}"
        step="${props.step}"
        value="${props.value}"
        ${props.disabled ? 'disabled' : ''}
        style="
          width: 100%;
          accent-color: ${trackColor};
          cursor: ${props.disabled ? 'not-allowed' : 'pointer'};
          opacity: ${props.disabled ? 0.5 : 1};
        "
      />
    </div>
  `;
  
  const input = element.querySelector('input');
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  if (input) {
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      const valueLabel = element.querySelector('span:last-child');
      if (valueLabel && props.showValue) {
        valueLabel.textContent = `${v.toFixed(props.step < 1 ? 2 : 0)}${props.unit ? ' ' + props.unit : ''}`;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        emit?.('change', v);
      }, 500);
    });
  }
  
  return () => {
    if (timer) clearTimeout(timer);
  };
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
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    let cleanup = renderSlider(element, currentProps, colors, ctx.emit);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        cleanup();
        cleanup = renderSlider(element, currentProps, colors, ctx.emit);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        cleanup();
        cleanup = renderSlider(element, currentProps, colors, newCtx.emit);
      },
      destroy: () => {
        cleanup();
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
