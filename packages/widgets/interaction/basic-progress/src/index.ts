import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props, type Threshold } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch?.[1]) {
    const hex = hexMatch[1];
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const num = Number.parseInt(fullHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1].split(',').map(p => p.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
    }
  }
  return normalized;
}

function resolveColor(value: number, base: string, thresholds: Threshold[]): string {
  const sorted = [...thresholds].sort((a, b) => a.at - b.at);
  let result = base;
  for (const t of sorted) {
    if (value >= t.at) result = t.color;
  }
  return result;
}

function pct(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function renderProgress(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const textPrimary = props.textColor || colors.fg;
  const textSecondary = withAlpha(textPrimary, 0.7);
  const trackColor = props.trackColor || withAlpha(textPrimary, 0.1);
  const primaryColor = props.color || colors.primary || '#3b82f6';
  const radius = Math.max(0, props.borderRadius);
  const percentage = pct(props.value, props.max);
  const barColor = resolveColor(props.value, primaryColor, props.thresholds);
  const isCompactHorizontal = props.orientation === 'horizontal' && !props.label && props.showValue;
  const transition = props.animated ? 'width 0.4s ease, height 0.4s ease, background 0.3s ease' : 'none';

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;
  
  const labelHtml = props.label ? `
    <span style="
      font-size: ${props.fontSize}px;
      font-weight: 500;
      color: ${textSecondary};
    ">${props.label}</span>
  ` : '';
  
  const valueHtml = props.showValue ? `
    <span style="
      font-size: ${props.fontSize}px;
      font-weight: 600;
      color: ${barColor};
    ">${props.value}${props.unit}</span>
  ` : '';
  
  const headerHtml = (labelHtml || valueHtml) ? `
    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    ">
      ${labelHtml}
      ${valueHtml}
    </div>
  ` : '';

  if (isCompactHorizontal) {
    const trackHeight = Math.max(8, Math.min(16, element.clientHeight - 8));

    element.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        height: 100%;
        padding: 4px 8px;
        box-sizing: border-box;
      ">
        <div style="
          flex: 1 1 auto;
          min-width: 0;
          height: ${trackHeight}px;
          border-radius: ${radius}px;
          overflow: hidden;
          background: ${trackColor};
        ">
          <div style="
            height: 100%;
            width: ${percentage}%;
            border-radius: ${radius}px;
            background: ${barColor};
            transition: ${transition};
          "></div>
        </div>
        <span style="
          flex: 0 0 auto;
          font-size: ${props.fontSize}px;
          font-weight: 600;
          color: ${barColor};
          line-height: 1;
          white-space: nowrap;
        ">${props.value}${props.unit}</span>
      </div>
    `;

    return;
  }

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
      ${headerHtml}
      <div style="
        width: 100%;
        height: 12px;
        border-radius: ${radius}px;
        overflow: hidden;
        background: ${trackColor};
      ">
        <div style="
          height: 100%;
          width: ${percentage}%;
          border-radius: ${radius}px;
          background: ${barColor};
          transition: ${transition};
        "></div>
      </div>
    </div>
  `;
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
    
    renderProgress(element, currentProps, colors);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderProgress(element, currentProps, colors);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderProgress(element, currentProps, colors);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
