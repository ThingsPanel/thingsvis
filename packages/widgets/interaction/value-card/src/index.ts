import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as LucideIcons from 'lucide-react';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

// ============================================================================
// Constants
// ============================================================================
const DEFAULT_CARD_WIDTH = 160;
const DEFAULT_CARD_HEIGHT = 80;
const DEFAULT_CARD_PADDING_X = 16;
const DEFAULT_CARD_PADDING_Y = 16;
const TREND_COLOR_POSITIVE = '#22c55e';
const TREND_COLOR_NEGATIVE = '#ef4444';
const MIN_ICON_BADGE_SIZE = 16;
const MIN_ICON_FONT_SIZE = 10;
const MIN_ICON_GLYPH_SIZE = 12;
const DEFAULT_ICON_STROKE_WIDTH = 2.25;
const ICON_SLOT_SELECTOR = '[data-value-card-icon-slot="true"]';

// ============================================================================
// Utils
// ============================================================================
function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatValue(value: unknown, precision: number, useGrouping: boolean): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping,
  }).format(num);
}

function iconComponentNameFromValue(icon: string): string {
  const trimmed = icon.trim();
  if (!trimmed) return '';

  const raw = trimmed.startsWith('i-lucide:') ? trimmed.slice('i-lucide:'.length) : trimmed;
  return raw
    .split(/[-_:]/g)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveIconComponent(icon: string): LucideIcons.LucideIcon | null {
  const iconName = iconComponentNameFromValue(icon);
  if (!iconName) return null;

  const iconRegistry = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>;
  const iconComponent = iconRegistry[iconName];
  return iconComponent ?? null;
}

function iconLabelFromValue(icon: string): string {
  const trimmed = icon.trim();
  if (!trimmed) return '';

  const raw = trimmed.startsWith('i-lucide:') ? trimmed.slice('i-lucide:'.length) : trimmed;
  const words = raw
    .split(/[-_:]/g)
    .map(part => part.trim())
    .filter(Boolean);

  if (words.length === 0) return '';

  // Multi-word: take first letter of first 2 words (e.g. "bar-chart" → "BC")
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  // Single-word: take first 2 characters (e.g. "box" → "BO")
  const word = words[0] ?? '';
  return word.length >= 2
    ? word.substring(0, 2).toUpperCase()
    : word.charAt(0).toUpperCase();
}

function renderIconBadgeFrame(contentHtml: string, badgeSize: number): string {
  return `
    <div style="
      width: ${badgeSize}px;
      height: ${badgeSize}px;
      min-width: ${badgeSize}px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: currentColor;
      background: currentColor;
      opacity: 0.9;
      position: relative;
      overflow: hidden;
    ">
      ${contentHtml}
    </div>
  `;
}

// ============================================================================
// Render helpers
// ============================================================================
function renderTrendBadge(trend: number, fontSize: number): string {
  if (trend === 0) return '';
  const isPositive = trend > 0;
  const color = isPositive ? TREND_COLOR_POSITIVE : TREND_COLOR_NEGATIVE;
  const sign = isPositive ? '+' : '';
  const arrow = isPositive ? '▲' : '▼';
  const displayTrend = `${sign}${trend.toFixed(2)}%`;

  return `
    <div style="
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: ${Math.max(10, fontSize - 2)}px;
      font-weight: 600;
      color: ${color};
      background: ${color}1a;
      white-space: nowrap;
      flex-shrink: 0;
    ">
      <span style="font-size: ${Math.max(8, fontSize - 4)}px;">${arrow}</span>
      ${escapeHtml(displayTrend)}
    </div>
  `;
}

// ============================================================================
// Render
// ============================================================================
function renderCard(element: HTMLElement, props: Props, colors: WidgetColors): Root | null {
  const {
    title, prefix, value, suffix, subtitle, trend, precision,
    icon, iconSize,
    titleFontSize, valueFontSize, suffixFontSize, subtitleFontSize,
    align
  } = props;

  const paddingX = DEFAULT_CARD_PADDING_X;
  const paddingY = DEFAULT_CARD_PADDING_Y;
  const titleSize = titleFontSize;
  const mainValueSize = valueFontSize;
  const unitSize = suffixFontSize;
  const subTitleSize = subtitleFontSize;
  const contentGap = 8;

  // Formatting value (always useGrouping internally as per spec)
  const displayValue = formatValue(value, precision, true);

  // Alignment configuration
  let alignItems = 'flex-start';
  let textAlign = 'left';
  if (align === 'center') {
    alignItems = 'center';
    textAlign = 'center';
  } else if (align === 'right') {
    alignItems = 'flex-end';
    textAlign = 'right';
  }

  let iconHtml = '';
  let iconComponent: LucideIcons.LucideIcon | null = null;
  let iconGlyphSize = 0;
  if (icon) {
    const badgeSize = Math.max(iconSize, MIN_ICON_BADGE_SIZE);
    iconGlyphSize = Math.max(MIN_ICON_GLYPH_SIZE, Math.round(badgeSize * 0.58));
    iconComponent = resolveIconComponent(icon);

    if (iconComponent) {
      iconHtml = renderIconBadgeFrame(
        `<div data-value-card-icon-slot="true" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${colors.bg};"></div>`,
        badgeSize,
      ).replace('color: currentColor;', `color: ${colors.bg};`).replace('background: currentColor;', `background: ${colors.fg};`);
    } else {
      const iconLabel = iconLabelFromValue(icon);
      if (iconLabel) {
        const fontSize = Math.max(MIN_ICON_FONT_SIZE, Math.round(badgeSize * 0.42));
        iconHtml = renderIconBadgeFrame(
          `<span style="font-size:${fontSize}px;font-weight:700;letter-spacing:0.04em;color:${colors.bg};">${escapeHtml(iconLabel)}</span>`,
          badgeSize,
        ).replace('color: currentColor;', `color: ${colors.bg};`).replace('background: currentColor;', `background: ${colors.fg};`);
      }
    }
  }

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;

  // Trend badge HTML
  const trendHtml = renderTrendBadge(trend, subtitleFontSize);

  // Row 1 visibility: only render when icon or trend exists
  const hasRow1 = iconHtml || trendHtml;

  // HTML Structure — 4-row layout per spec v2
  element.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: ${contentGap}px;
      align-items: ${alignItems};
      text-align: ${textAlign};
      padding: ${paddingY}px ${paddingX}px;
      color: ${colors.fg};
      background: transparent;
    ">
      ${hasRow1 ? `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        ">
          ${iconHtml}
          ${trendHtml}
        </div>
      ` : ''}

      <div style="
        font-size: ${titleSize}px;
        opacity: 0.7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
      ">
        ${escapeHtml(title)}
      </div>

      <div style="
        display: flex;
        align-items: baseline;
        gap: 4px;
        line-height: 1.2;
        font-feature-settings: 'tnum';
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        justify-content: ${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'};
      ">
        ${prefix ? `
          <span style="font-size: ${unitSize}px; opacity: 0.8;">
            ${escapeHtml(prefix)}
          </span>
        ` : ''}
        <span style="font-size: ${mainValueSize}px; font-weight: 600;">
          ${escapeHtml(displayValue)}
        </span>
        ${suffix ? `
          <span style="font-size: ${unitSize}px; opacity: 0.8;">
            ${escapeHtml(suffix)}
          </span>
        ` : ''}
      </div>

      ${subtitle ? `
        <div style="
          font-size: ${subTitleSize}px;
          opacity: 0.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        ">
          ${escapeHtml(subtitle)}
        </div>
      ` : ''}
    </div>
  `;

  if (iconComponent) {
    const iconSlot = element.querySelector(ICON_SLOT_SELECTOR);
    if (iconSlot instanceof HTMLElement) {
      const iconRoot = createRoot(iconSlot);
      iconRoot.render(createElement(iconComponent, {
        size: iconGlyphSize,
        color: colors.bg,
        strokeWidth: DEFAULT_ICON_STROKE_WIDTH,
      }));
      return iconRoot;
    }
  }

  return null;
}

// ============================================================================
// Widget Export
// ============================================================================
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
    let iconRoot: Root | null = null;

    const renderWidget = () => {
      iconRoot?.unmount();
      iconRoot = renderCard(element, currentProps, colors);
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
      update: (newProps: Props) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderWidget();
      },
      destroy: () => {
        iconRoot?.unmount();
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
