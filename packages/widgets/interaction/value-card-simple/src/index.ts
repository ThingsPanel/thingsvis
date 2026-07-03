import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, resolveLayeredColor, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const CARD_PADDING = 16;

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

function normalizeLegacyColor(value: string | undefined): string {
  const trimmed = String(value ?? '').trim();
  const legacySemantic: Record<string, string> = {
    success: '#34c759',
    warning: '#ff9500',
    danger: '#ff3b30',
  };
  return legacySemantic[trimmed] ?? trimmed;
}

function formatValue(value: unknown, precision: number): string {
  if (value === null || value === undefined) return '-';

  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  const absNum = Math.abs(num);
  if (absNum >= 1e9) return (num / 1e9).toFixed(precision) + 'B';
  if (absNum >= 1e6) return (num / 1e6).toFixed(precision) + 'M';
  if (absNum >= 1e3 && precision === 0) return (num / 1e3).toFixed(1) + 'K';

  return num.toFixed(precision);
}

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCard(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const textSecondary = withAlpha(colors.fg, 0.5);

  const displayValue = formatValue(props.value, props.precision);

  const titleColor = resolveLayeredColor({
    instance: normalizeLegacyColor(props.titleColor),
    theme: textSecondary,
    fallback: textSecondary,
  });
  const valueColor = resolveLayeredColor({
    instance: normalizeLegacyColor(props.valueColor),
    theme: colors.fg,
    fallback: colors.fg,
  });
  const unitColor = resolveLayeredColor({
    instance: normalizeLegacyColor(props.unitColor),
    theme: textSecondary,
    fallback: textSecondary,
  });

  const trendValue = Number(props.trend);
  const showTrend = props.showTrend && Number.isFinite(trendValue);
  const isPositive = trendValue >= 0;
  const trendColor = isPositive ? '#34c759' : '#ff3b30';

  const titleSize = props.titleFontSize;
  const valueSize = props.valueFontSize;
  const unitSize = props.unitFontSize;

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

  element.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      text-align: left;
      padding: ${CARD_PADDING}px;
      gap: 6px;
      background: transparent;
    ">
      <div style="
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      ">
        <div style="
          width: 100%;
          font-size: ${titleSize}px;
          font-weight: 500;
          color: ${titleColor};
          letter-spacing: 0.01em;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${escapeHtml(props.title)}</div>

        <div style="
          display: flex;
          align-items: baseline;
          justify-content: flex-start;
          gap: 6px;
          width: 100%;
        ">
          <span style="
            font-size: ${valueSize}px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: ${valueColor};
            line-height: 1.1;
            font-feature-settings: 'tnum';
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${escapeHtml(displayValue)}</span>
          ${props.showUnit && props.unit ? `
            <span style="
              font-size: ${unitSize}px;
              font-weight: 500;
              color: ${unitColor};
            ">${escapeHtml(props.unit)}</span>
          ` : ''}
        </div>

        ${showTrend ? `
          <div style="
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 4px;
            margin-top: 6px;
            font-size: 11px;
            font-weight: 600;
            color: ${trendColor};
            width: 100%;
          ">
            <span>${isPositive ? '↑' : '↓'}</span>
            <span>${Math.abs(trendValue).toFixed(1)}%</span>
            ${props.trendLabel ? `<span style="font-weight: 400; opacity: 0.7;">${escapeHtml(props.trendLabel)}</span>` : ''}
          </div>
        ` : ''}
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

    const renderWidget = () => {
      renderCard(element, currentProps, colors);
    };

    renderWidget();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderWidget();
      });
      ro.observe(element);
    }

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderWidget();
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
