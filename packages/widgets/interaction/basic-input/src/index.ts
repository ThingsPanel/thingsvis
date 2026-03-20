import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
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

function renderInput(element: HTMLElement, props: Props, colors: WidgetColors, emit?: (event: string, data: unknown) => void): void {
  const textPrimary = props.textColor || colors.fg;
  const textSecondary = withAlpha(textPrimary, 0.6);
  const borderColor = props.borderColor || withAlpha(textPrimary, 0.15);
  const accentColor = props.accentColor || colors.primary;
  const inputBg = withAlpha(textPrimary, 0.05);
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;
  
  const labelHtml = props.label ? `
    <label style="
      font-size: ${Math.max(props.fontSize - 2, 10)}px;
      font-weight: 500;
      color: ${textSecondary};
      margin-bottom: 4px;
      display: block;
    ">${props.label}</label>
  ` : '';
  
  element.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 6px 10px;
      box-sizing: border-box;
    ">
      ${labelHtml}
      <input 
        type="${props.inputType}"
        placeholder="${props.placeholder}"
        value="${props.value}"
        ${props.disabled ? 'disabled' : ''}
        style="
          width: 100%;
          box-sizing: border-box;
          font-size: ${props.fontSize}px;
          color: ${textPrimary};
          background: ${inputBg};
          border: 1.5px solid ${borderColor};
          border-radius: 6px;
          padding: 6px 10px;
          outline: none;
          opacity: ${props.disabled ? 0.5 : 1};
          transition: border-color 0.15s;
          font-family: inherit;
        "
      />
    </div>
  `;
  
  const input = element.querySelector('input');
  if (input) {
    input.addEventListener('focus', () => {
      input.style.borderColor = accentColor;
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = borderColor;
      if (props.submitOn === 'blur' || props.submitOn === 'both') {
        emit?.('submit', input.type === 'number' ? Number(input.value) : input.value);
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (props.submitOn === 'enter' || props.submitOn === 'both')) {
        emit?.('submit', input.type === 'number' ? Number(input.value) : input.value);
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
    
    renderInput(element, currentProps, colors, ctx.emit);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderInput(element, currentProps, colors, ctx.emit);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderInput(element, currentProps, colors, newCtx.emit);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
