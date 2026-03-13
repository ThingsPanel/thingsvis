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

function parseOptions(optionsJson: string): Array<{ label: string; value: string }> {
  try {
    return JSON.parse(optionsJson) as Array<{ label: string; value: string }>;
  } catch {
    return [];
  }
}

function renderSelect(element: HTMLElement, props: Props, colors: WidgetColors, emit?: (event: string, data: unknown) => void): void {
  const textPrimary = colors.fg;
  const borderColor = withAlpha(textPrimary, 0.15);
  const selectBg = withAlpha(textPrimary, 0.05);
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  `;
  
  const options = parseOptions(props.options);
  const optionsHtml = options.map(opt => 
    `<option value="${opt.value}" ${opt.value === props.value ? 'selected' : ''}>${opt.label}</option>`
  ).join('');
  
  const placeholderHtml = props.placeholder ? 
    `<option value="" disabled ${!props.value ? 'selected' : ''}>${props.placeholder}</option>` : '';
  
  element.innerHTML = `
    <select 
      ${props.disabled ? 'disabled' : ''}
      style="
        width: 100%;
        height: 100%;
        font-size: ${props.fontSize}px;
        font-family: inherit;
        background: ${selectBg};
        color: ${textPrimary};
        border: 1px solid ${borderColor};
        border-radius: 6px;
        padding: 0 32px 0 10px;
        box-sizing: border-box;
        cursor: ${props.disabled ? 'not-allowed' : 'pointer'};
        opacity: ${props.disabled ? 0.5 : 1};
        outline: none;
        appearance: none;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"${encodeURIComponent(textPrimary)}\"><path d=\"M6 8L1 3h10z\"/></svg>');
        background-repeat: no-repeat;
        background-position: right 10px center;
      "
    >
      ${placeholderHtml}
      ${optionsHtml}
    </select>
  `;
  
  const select = element.querySelector('select');
  if (select) {
    select.addEventListener('change', () => {
      emit?.('change', select.value);
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
    
    renderSelect(element, currentProps, colors, ctx.emit);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderSelect(element, currentProps, colors, ctx.emit);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderSelect(element, currentProps, colors, newCtx.emit);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
