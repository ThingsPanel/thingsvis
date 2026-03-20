import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const SIZE_TOKENS = {
  default: {
    trackWidth: 44,
    trackHeight: 24,
    thumbSize: 18,
    thumbOffset: 3,
    innerFontSize: 10,
    labelFontSize: 14,
  },
  small: {
    trackWidth: 28,
    trackHeight: 16,
    thumbSize: 12,
    thumbOffset: 2,
    innerFontSize: 8,
    labelFontSize: 12,
  },
} as const;

const SPINNER_CSS_ID = '__tv-switch-spinner-css';
function ensureSpinnerCSS(): void {
  if (document.getElementById(SPINNER_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = SPINNER_CSS_ID;
  style.textContent = `@keyframes tv-switch-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}

function renderSwitch(
  element: HTMLElement, 
  props: Props, 
  colors: WidgetColors, 
  internalChecked: boolean,
  isLoading: boolean,
  onToggle: () => void
): void {
  const t = SIZE_TOKENS[props.size] ?? SIZE_TOKENS['default'];
  const thumbPos = internalChecked
    ? t.trackWidth - t.thumbSize - t.thumbOffset
    : t.thumbOffset;
  
  const onColor = colors.primary || '#22c55e';
  const offColor = colors.axis || '#d1d5db';
  const trackColor = internalChecked ? onColor : offColor;
  
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;
  
  const labelHtml = props.showLabel ? `
    <span style="
      font-size: ${t.labelFontSize}px;
      color: ${colors.fg};
      white-space: nowrap;
      user-select: none;
    ">${props.label}</span>
  ` : '';
  
  const spinnerSize = Math.round(t.thumbSize * 0.55);
  const spinnerHtml = isLoading ? `
    <div style="
      width: ${spinnerSize}px;
      height: ${spinnerSize}px;
      border: 2px solid ${internalChecked ? onColor : '#999'};
      border-top-color: transparent;
      border-radius: 50%;
      animation: tv-switch-spin 0.6s linear infinite;
      box-sizing: border-box;
    "></div>
  ` : '';
  
  const onTextHtml = props.onLabel ? `
    <span style="
      position: absolute;
      top: 50%;
      left: ${t.thumbOffset + 2}px;
      transform: translateY(-50%);
      font-size: ${t.innerFontSize}px;
      color: #fff;
      font-weight: 600;
      line-height: 1;
      pointer-events: none;
      white-space: nowrap;
      opacity: ${internalChecked ? 1 : 0};
      transition: opacity 0.15s;
    ">${props.onLabel}</span>
  ` : '';
  
  const offTextHtml = props.offLabel ? `
    <span style="
      position: absolute;
      top: 50%;
      right: ${t.thumbOffset + 2}px;
      transform: translateY(-50%);
      font-size: ${t.innerFontSize}px;
      color: #fff;
      font-weight: 600;
      line-height: 1;
      pointer-events: none;
      white-space: nowrap;
      opacity: ${!internalChecked ? 1 : 0};
      transition: opacity 0.15s;
    ">${props.offLabel}</span>
  ` : '';
  
  const trackHtml = `
    <div id="track" style="
      position: relative;
      width: ${t.trackWidth}px;
      height: ${t.trackHeight}px;
      border-radius: ${t.trackHeight / 2}px;
      background: ${trackColor};
      transition: background 0.2s;
      flex-shrink: 0;
      overflow: hidden;
      cursor: ${props.disabled || isLoading ? 'not-allowed' : 'pointer'};
    ">
      ${onTextHtml}
      ${offTextHtml}
      <div style="
        position: absolute;
        top: ${t.thumbOffset}px;
        left: ${thumbPos}px;
        width: ${t.thumbSize}px;
        height: ${t.thumbSize}px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${spinnerHtml}
      </div>
    </div>
  `;
  
  element.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      height: 100%;
      padding: 0 8px;
      box-sizing: border-box;
      user-select: none;
      flex-direction: ${props.labelPosition === 'left' ? 'row' : 'row-reverse'};
      justify-content: ${props.labelPosition === 'left' ? 'flex-start' : 'flex-end'};
    ">
      ${labelHtml}
      ${trackHtml}
    </div>
  `;
  
  const track = element.querySelector('#track');
  if (track) {
    track.addEventListener('click', () => {
      if (!props.disabled && !isLoading) {
        onToggle();
      }
    });
  }
}

const ROLLBACK_TIMEOUT = 5000;

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
    ensureSpinnerCSS();
    
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    // Coerce initial value so numeric 0/1 from IoT bindings works as boolean.
    let internalChecked = typeof props.value === 'number' ? props.value !== 0 : Boolean(props.value);
    let isLoading = props.loading;
    let rollbackTimer: ReturnType<typeof setTimeout> | null = null;
    
    const handleToggle = () => {
      if (currentProps.confirmToggle) {
        if (!confirm(currentProps.confirmMessage)) return;
      }
      
      internalChecked = !internalChecked;
      isLoading = true;
      
      ctx.emit?.('change', internalChecked);
      
      if (rollbackTimer) clearTimeout(rollbackTimer);
      rollbackTimer = setTimeout(() => {
        isLoading = false;
        renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
      }, ROLLBACK_TIMEOUT);
      
      renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
    };
    
    renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;

        // IoT devices often send 0/1 (numbers) instead of booleans.
        // Accept any non-null value and coerce to boolean so the switch stays
        // in sync with the real device state.
        if (newProps.value !== undefined && newProps.value !== null) {
          internalChecked = typeof newProps.value === 'number'
            ? newProps.value !== 0
            : Boolean(newProps.value);
          isLoading = false;
          if (rollbackTimer) {
            clearTimeout(rollbackTimer);
            rollbackTimer = null;
          }
        }
        
        if (typeof newProps.loading === 'boolean') {
          isLoading = newProps.loading;
        }
        
        colors = resolveWidgetColors(element);
        renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
      },
      destroy: () => {
        if (rollbackTimer) clearTimeout(rollbackTimer);
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
