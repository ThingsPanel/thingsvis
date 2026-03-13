import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

interface PresetRange {
  label: string;
  get: () => { start: Date; end: Date };
}

const PRESETS: PresetRange[] = [
  {
    label: '今天',
    get() {
      const s = new Date(); s.setHours(0, 0, 0, 0);
      const e = new Date(); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    },
  },
  {
    label: '昨天',
    get() {
      const s = new Date(); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    },
  },
  {
    label: '本周',
    get() {
      const s = new Date(); const day = s.getDay();
      s.setDate(s.getDate() - (day === 0 ? 6 : day - 1)); s.setHours(0, 0, 0, 0);
      const e = new Date(); return { start: s, end: e };
    },
  },
  {
    label: '本月',
    get() {
      const s = new Date(); s.setDate(1); s.setHours(0, 0, 0, 0);
      const e = new Date(); return { start: s, end: e };
    },
  },
  {
    label: '最近7天',
    get() {
      const s = new Date(); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0);
      const e = new Date(); return { start: s, end: e };
    },
  },
  {
    label: '最近30天',
    get() {
      const s = new Date(); s.setDate(s.getDate() - 29); s.setHours(0, 0, 0, 0);
      const e = new Date(); return { start: s, end: e };
    },
  },
];

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

function toLocalInputValue(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function renderDatePicker(
  element: HTMLElement, 
  props: Props, 
  colors: WidgetColors,
  emit?: (event: string, data: unknown) => void
): void {
  const textPrimary = colors.fg;
  const textSecondary = withAlpha(textPrimary, 0.7);
  const borderColor = withAlpha(textPrimary, 0.15);
  const borderFocusColor = colors.primary;
  const inputBg = withAlpha(textPrimary, 0.05);
  const accentColor = colors.primary;
  
  const isDarkText = textPrimary.includes('#000') || textPrimary.includes('#111') || textPrimary.includes('rgba(0,') || textPrimary.includes('rgba(17,') || textPrimary.includes('rgb(0,');
  const colorScheme = isDarkText ? 'light' : 'dark';
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    border-radius: inherit;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  `;
  
  const labelHtml = props.label ? `
    <div style="
      font-size: ${props.fontSize}px;
      font-weight: 600;
      color: ${textSecondary};
      margin-bottom: 4px;
      flex-shrink: 0;
    ">${props.label}</div>
  ` : '';
  
  const presetsHtml = props.showPresets ? PRESETS.map(preset => `
    <button 
      class="preset-btn"
      data-label="${preset.label}"
      style="
        font-size: ${props.fontSize}px;
        color: ${accentColor};
        border: 1px solid ${withAlpha(accentColor, 0.3)};
        border-radius: 4px;
        background: transparent;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1 1 auto;
        text-align: center;
        white-space: nowrap;
      "
    >${preset.label}</button>
  `).join('') : '';
  
  element.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      padding: 8px 10px;
      box-sizing: border-box;
      background: transparent;
    ">
      ${labelHtml}
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        margin-bottom: ${props.showPresets ? '8px' : '0'};
        flex: 1;
      ">
        <input 
          type="datetime-local"
          id="start-input"
          value="${toLocalInputValue(props.startTime)}"
          style="
            flex: 1;
            width: 0;
            height: 100%;
            min-height: 28px;
            font-size: ${props.fontSize}px;
            font-family: inherit;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid ${borderColor};
            background: ${inputBg};
            color: ${textPrimary};
            color-scheme: ${colorScheme};
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s;
          "
        />
        <span style="
          color: ${textSecondary};
          font-size: ${props.fontSize}px;
          flex-shrink: 0;
        ">→</span>
        <input 
          type="datetime-local"
          id="end-input"
          value="${toLocalInputValue(props.endTime)}"
          style="
            flex: 1;
            width: 0;
            height: 100%;
            min-height: 28px;
            font-size: ${props.fontSize}px;
            font-family: inherit;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid ${borderColor};
            background: ${inputBg};
            color: ${textPrimary};
            color-scheme: ${colorScheme};
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s;
          "
        />
      </div>
      ${props.showPresets ? `
        <div style="
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
          flex: 0 0 auto;
        ">
          ${presetsHtml}
        </div>
      ` : ''}
    </div>
  `;
  
  const startInput = element.querySelector('#start-input') as HTMLInputElement;
  const endInput = element.querySelector('#end-input') as HTMLInputElement;
  
  const bindInputFocus = (input: HTMLInputElement) => {
    input.addEventListener('focus', () => {
      input.style.borderColor = borderFocusColor;
      input.style.boxShadow = `0 0 0 1px ${withAlpha(borderFocusColor, 0.2)}`;
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = borderColor;
      input.style.boxShadow = 'none';
    });
  };
  
  if (startInput) bindInputFocus(startInput);
  if (endInput) bindInputFocus(endInput);
  
  const emitChange = () => {
    const startVal = startInput?.value ? new Date(startInput.value).toISOString() : '';
    const endVal = endInput?.value ? new Date(endInput.value).toISOString() : '';
    emit?.('change', { startTime: startVal, endTime: endVal });
  };
  
  startInput?.addEventListener('change', emitChange);
  endInput?.addEventListener('change', emitChange);
  
  // Preset buttons
  element.querySelectorAll('.preset-btn').forEach(btn => {
    const label = btn.getAttribute('data-label');
    const preset = PRESETS.find(p => p.label === label);
    
    btn.addEventListener('mouseenter', () => {
      (btn as HTMLElement).style.background = accentColor;
      (btn as HTMLElement).style.color = '#fff';
    });
    
    btn.addEventListener('mouseleave', () => {
      (btn as HTMLElement).style.background = 'transparent';
      (btn as HTMLElement).style.color = accentColor;
    });
    
    btn.addEventListener('click', () => {
      if (preset && startInput && endInput) {
        const { start, end } = preset.get();
        startInput.value = toLocalInputValue(start.toISOString());
        endInput.value = toLocalInputValue(end.toISOString());
        emitChange();
      }
    });
  });
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
    
    renderDatePicker(element, currentProps, colors, ctx.emit);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderDatePicker(element, currentProps, colors, ctx.emit);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderDatePicker(element, currentProps, colors, newCtx.emit);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
