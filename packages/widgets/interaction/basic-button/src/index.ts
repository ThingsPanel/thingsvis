import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const CLICK_DEBOUNCE_MS = 300;

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

function renderButton(element: HTMLElement, props: Props, colors: WidgetColors, lastClickTs: { current: number }): void {
  const isOutline = props.variant === 'outline';
  const isGhost = props.variant === 'ghost';
  
  // Use theme colors
  const primaryColor = colors.primary || '#3b82f6';
  const bgColor = colors.bg || '#ffffff';
  const fgColor = colors.fg || '#000000';
  
  // Determine colors based on variant
  const buttonBg = isOutline || isGhost ? 'transparent' : primaryColor;
  const defaultTextColor = isOutline || isGhost ? primaryColor : '#ffffff';
  const buttonColor = props.textColor || defaultTextColor;
  const border = isOutline ? `2px solid ${primaryColor}` : 'none';
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;
  
  element.innerHTML = `
    <button style="
      width: 100%;
      height: 100%;
      font-size: ${props.fontSize}px;
      font-weight: 500;
      font-family: inherit;
      border-radius: ${props.borderRadius}px;
      cursor: ${props.disabled ? 'not-allowed' : 'pointer'};
      opacity: ${props.disabled ? 0.5 : 1};
      transition: opacity 0.15s, transform 0.1s;
      border: ${border};
      background: ${buttonBg};
      color: ${buttonColor};
      box-sizing: border-box;
      outline: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 16px;
    " ${props.disabled ? 'disabled' : ''}>${props.label}</button>
  `;
  
  const btn = element.querySelector('button');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!props.disabled) {
        const now = Date.now();
        if (now - lastClickTs.current < CLICK_DEBOUNCE_MS) return;
        lastClickTs.current = now;
        // Emit event via the widget context
        element.dispatchEvent(new CustomEvent('widget:emit', { 
          detail: { event: 'click', data: { label: props.label } },
          bubbles: true 
        }));
      }
    });
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
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    const lastClickTs = { current: 0 };
    
    renderButton(element, currentProps, colors, lastClickTs);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderButton(element, currentProps, colors, lastClickTs);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderButton(element, currentProps, colors, lastClickTs);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
