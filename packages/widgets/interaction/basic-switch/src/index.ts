import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as LucideIcons from 'lucide-react';
import {
  defineWidget,
  type WidgetOverlayContext,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
} from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const SIZE_TOKENS = {
  default: {
    trackWidth: 52,
    trackHeight: 30,
    thumbSize: 24,
    thumbOffset: 3,
    iconMinSize: 40,
  },
  small: {
    trackWidth: 42,
    trackHeight: 24,
    thumbSize: 18,
    thumbOffset: 3,
    iconMinSize: 34,
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

function coerceBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'off' ||
      normalized === 'no'
    ) {
      return false;
    }
    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'on' ||
      normalized === 'yes'
    ) {
      return true;
    }
  }
  return value == null ? fallback : Boolean(value);
}

function shouldEmitNumericPayload(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized === '0' || normalized === '1';
  }
  return false;
}

function toSwitchEventPayload(checked: boolean, sourceValue: unknown): boolean | number {
  return shouldEmitNumericPayload(sourceValue) ? (checked ? 1 : 0) : checked;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function iconComponentNameFromValue(icon: string): string {
  const trimmed = icon.trim();
  if (!trimmed) return '';

  const raw = trimmed.startsWith('i-lucide:') ? trimmed.slice('i-lucide:'.length) : trimmed;
  return raw
    .split(/[-_:]/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveIconComponent(icon: string): LucideIcons.LucideIcon | null {
  const iconName = iconComponentNameFromValue(icon);
  if (!iconName) return null;

  const iconRegistry = LucideIcons as unknown as Record<
    string,
    LucideIcons.LucideIcon | undefined
  >;
  return iconRegistry[iconName] ?? null;
}

function renderIconMarkup(icon: string, size: number, color: string): string {
  const iconComponent = resolveIconComponent(icon);
  if (!iconComponent) return '';

  return renderToStaticMarkup(
    createElement(iconComponent, {
      width: size,
      height: size,
      color,
      strokeWidth: 1.8,
      'aria-hidden': true,
    }),
  );
}

function renderSwitch(
  element: HTMLElement,
  props: Props,
  colors: WidgetColors,
  internalChecked: boolean,
  isLoading: boolean,
  onToggle: () => void,
): void {
  const t = SIZE_TOKENS[props.size] ?? SIZE_TOKENS['default'];
  const trackWidth = t.trackWidth;
  const trackHeight = t.trackHeight;
  const thumbSize = t.thumbSize;
  const thumbOffset = t.thumbOffset;
  const thumbPos = internalChecked ? trackWidth - thumbSize - thumbOffset : thumbOffset;
  const elementWidth = element.clientWidth || 160;
  const elementHeight = element.clientHeight || 80;
  const iconSize = Math.round(
    clamp(Math.min(elementHeight * 0.72, elementWidth * 0.28), t.iconMinSize, 56),
  );
  const horizontalPadding = clamp(Math.round(elementWidth * 0.05), 8, 16);

  const onColor = resolveLayeredColor({
    instance: props.onColor,
    theme: colors.primary,
    fallback: '#22c55e',
  });
  const offColor = resolveLayeredColor({
    instance: props.offColor,
    theme: colors.axis,
    fallback: '#d1d5db',
  });
  const trackColor = internalChecked ? onColor : offColor;
  const showLabel = coerceBoolean(props.showLabel, true);
  const disabled = coerceBoolean(props.disabled, false);
  const statusLabel = internalChecked ? props.onLabel : props.offLabel;
  const iconColor = internalChecked ? onColor : colors.fg;

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;

  const textHtml = showLabel
    ? `
    <div data-tv-switch-text style="
      min-width: 0;
      flex: 1 1 auto;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 2px;
    ">
      <span data-tv-switch-title style="
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: ${props.labelFontSize}px;
        line-height: 1.15;
        font-weight: 600;
        color: ${colors.fg};
        user-select: none;
      ">${escapeHtml(props.label)}</span>
      ${statusLabel
        ? `<span data-tv-switch-status style="
          display: block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: ${Math.max(11, Math.round(props.labelFontSize * 0.82))}px;
          line-height: 1.1;
          color: ${colors.textSecondary};
          user-select: none;
        ">${escapeHtml(statusLabel)}</span>`
        : ''}
    </div>
  `
    : '';

  const iconMarkup = renderIconMarkup(props.icon, Math.round(iconSize * 0.5), iconColor);
  const iconHtml = iconMarkup
    ? `
    <div data-tv-switch-icon style="
      width: ${iconSize}px;
      height: ${iconSize}px;
      min-width: ${iconSize}px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      color: ${iconColor};
      background: ${colors.axis};
      border: 1px solid ${colors.surfaceBorder};
      transition: color 0.2s, background 0.2s;
      opacity: ${disabled ? 0.55 : 1};
    " aria-hidden="true">
      ${iconMarkup}
    </div>
  `
    : '';

  const spinnerSize = Math.round(thumbSize * 0.55);
  const spinnerHtml = isLoading
    ? `
    <div style="
      width: ${spinnerSize}px;
      height: ${spinnerSize}px;
      border: 2px solid ${internalChecked ? onColor : '#999'};
      border-top-color: transparent;
      border-radius: 50%;
      animation: tv-switch-spin 0.6s linear infinite;
      box-sizing: border-box;
    "></div>
  `
    : '';

  const trackHtml = `
    <div id="track" style="
      position: relative;
      width: ${trackWidth}px;
      height: ${trackHeight}px;
      border-radius: ${trackHeight / 2}px;
      background: ${trackColor};
      transition: background 0.2s;
      flex-shrink: 0;
      overflow: hidden;
      cursor: ${disabled || isLoading ? 'not-allowed' : 'pointer'};
      opacity: ${disabled ? 0.55 : 1};
      outline: none;
    " role="switch" aria-label="${escapeHtml(props.label)}" aria-checked="${internalChecked}" aria-disabled="${disabled || isLoading}" aria-busy="${isLoading}" tabindex="${disabled ? -1 : 0}">
      <div style="
        position: absolute;
        top: ${thumbOffset}px;
        left: ${thumbPos}px;
        width: ${thumbSize}px;
        height: ${thumbSize}px;
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
      min-width: 0;
      padding: 0 ${horizontalPadding}px;
      box-sizing: border-box;
      user-select: none;
      flex-direction: ${props.labelPosition === 'left' ? 'row' : 'row-reverse'};
      justify-content: ${props.labelPosition === 'left' ? 'flex-start' : 'flex-end'};
    ">
      <div data-tv-switch-content style="
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
      ">
        ${iconHtml}
        ${textHtml}
      </div>
      ${trackHtml}
    </div>
  `;

  const track = element.querySelector<HTMLElement>('#track');
  if (track) {
    track.addEventListener('click', () => {
      if (!disabled && !isLoading) {
        onToggle();
      }
    });
    track.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled && !isLoading) onToggle();
      }
    });
  }
}

const LOADING_FEEDBACK_TIMEOUT = 800;

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
    let internalChecked = coerceBoolean(props.value);
    let isLoading = coerceBoolean(props.loading);
    let rollbackTimer: ReturnType<typeof setTimeout> | null = null;

    const handleToggle = () => {
      if (coerceBoolean(currentProps.confirmToggle)) {
        if (!confirm(currentProps.confirmMessage)) return;
      }

      internalChecked = !internalChecked;
      isLoading = true;

      ctx.emit?.('change', toSwitchEventPayload(internalChecked, currentProps.value));

      if (rollbackTimer) clearTimeout(rollbackTimer);
      rollbackTimer = setTimeout(() => {
        isLoading = false;
        renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
      }, LOADING_FEEDBACK_TIMEOUT);

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
          internalChecked = coerceBoolean(newProps.value);
          isLoading = false;
          if (rollbackTimer) {
            clearTimeout(rollbackTimer);
            rollbackTimer = null;
          }
        }

        if (newProps.loading !== undefined && newProps.loading !== null) {
          isLoading = coerceBoolean(newProps.loading);
        }

        colors = resolveWidgetColors(element);
        renderSwitch(element, currentProps, colors, internalChecked, isLoading, handleToggle);
      },
      destroy: () => {
        if (rollbackTimer) clearTimeout(rollbackTimer);
        ro?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
