import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as LucideIcons from 'lucide-react';
import {
  defineWidget,
  resolveLayeredColor,
  type WidgetOverlayContext,
  resolveWidgetColors,
  type WidgetColors,
} from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

// ============================================================================
// Constants
// ============================================================================
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

function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch?.[1]) {
    const hex = hexMatch[1];
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const num = Number.parseInt(fullHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
    }
  }
  return normalized;
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
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) return '';

  // Multi-word: take first letter of first 2 words (e.g. "bar-chart" → "BC")
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

  // Single-word: take first 2 characters (e.g. "box" → "BO")
  const word = words[0] ?? '';
  return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.charAt(0).toUpperCase();
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

function renderLineIconFrame(contentHtml: string, iconSize: number, iconColor: string): string {
  return `
    <div
      data-value-card-icon-style="line"
      aria-hidden="true"
      style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        min-width: ${iconSize}px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: ${iconColor};
        overflow: hidden;
      "
    >
      ${contentHtml}
    </div>
  `;
}

// ============================================================================
// Render helpers
// ============================================================================
function renderTrendBadge(
  trend: number,
  fontSize: number,
  positiveColor: string,
  negativeColor: string,
): string {
  if (trend === 0) return '';
  const isPositive = trend > 0;
  const color = isPositive ? positiveColor : negativeColor;
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
      background: ${withAlpha(color, 0.1)};
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
function renderCard(
  element: HTMLElement,
  props: Props,
  colors: WidgetColors,
  ctx: WidgetOverlayContext,
): Root | null {
  const {
    title,
    prefix,
    value,
    suffix,
    unit,
    subtitle,
    trend,
    precision,
    icon,
    iconPosition,
    iconSize,
    titleFontSize,
    valueFontSize,
    suffixFontSize,
    subtitleFontSize,
    titleColor: titleColorProp,
    valueColor: valueColorProp,
    subtitleColor: subtitleColorProp,
    iconColor: iconColorProp,
    iconBackgroundColor: iconBackgroundColorProp,
    trendUpColor: trendUpColorProp,
    trendDownColor: trendDownColorProp,
    align,
  } = props;

  const titleSize = titleFontSize;
  const mainValueSize = valueFontSize;
  const unitSize = suffixFontSize;
  // Older device-model presets persisted the model unit in `unit`, while the
  // card renderer only displayed `suffix` (whose default is "元"). Prefer the
  // model unit when present so existing cards stay truthful without migration.
  const displaySuffix = unit?.trim() || suffix;
  const subTitleSize = subtitleFontSize;
  const contentGap = 8;
  const titleColor = resolveLayeredColor({
    instance: titleColorProp,
    theme: colors.textSecondary,
    fallback: colors.textSecondary,
  });
  const valueColor = resolveLayeredColor({
    instance: valueColorProp,
    theme: colors.textPrimary,
    fallback: colors.textPrimary,
  });
  const subtitleColor = resolveLayeredColor({
    instance: subtitleColorProp,
    theme: colors.textMuted,
    fallback: colors.textMuted,
  });
  const iconColor = resolveLayeredColor({
    instance: iconColorProp,
    theme: colors.primary,
    fallback: colors.primary,
  });
  const iconBackgroundColor = resolveLayeredColor({
    instance: iconBackgroundColorProp,
    theme: withAlpha(colors.primary, 0.14),
    fallback: withAlpha(colors.primary, 0.14),
  });
  const trendUpColor = resolveLayeredColor({
    instance: trendUpColorProp,
    theme: colors.primary,
    fallback: colors.primary,
  });
  const trendDownColor = resolveLayeredColor({
    instance: trendDownColorProp,
    theme: colors.textSecondary,
    fallback: colors.textSecondary,
  });

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
  const hasSideIconPosition = iconPosition === 'left' || iconPosition === 'right';
  if (icon) {
    const resolvedIconSize = Math.max(iconSize, MIN_ICON_BADGE_SIZE);
    iconGlyphSize = Math.max(
      MIN_ICON_GLYPH_SIZE,
      Math.round(resolvedIconSize * (hasSideIconPosition ? 0.72 : 0.58)),
    );
    iconComponent = resolveIconComponent(icon);

    if (iconComponent) {
      const iconSlotHtml = `<div data-value-card-icon-slot="true" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${iconColor};"></div>`;
      iconHtml = hasSideIconPosition
        ? renderLineIconFrame(iconSlotHtml, resolvedIconSize, iconColor)
        : renderIconBadgeFrame(iconSlotHtml, resolvedIconSize)
            .replace('color: currentColor;', `color: ${iconColor};`)
            .replace('background: currentColor;', `background: ${iconBackgroundColor};`);
    } else {
      const iconLabel = iconLabelFromValue(icon);
      if (iconLabel) {
        const fontSize = Math.max(MIN_ICON_FONT_SIZE, Math.round(resolvedIconSize * 0.42));
        const iconLabelHtml = `<span style="font-size:${fontSize}px;font-weight:700;letter-spacing:0.04em;color:${iconColor};">${escapeHtml(iconLabel)}</span>`;
        iconHtml = hasSideIconPosition
          ? renderLineIconFrame(iconLabelHtml, resolvedIconSize, iconColor)
          : renderIconBadgeFrame(iconLabelHtml, resolvedIconSize)
              .replace('color: currentColor;', `color: ${iconColor};`)
              .replace('background: currentColor;', `background: ${iconBackgroundColor};`);
      }
    }
  }

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;

  // Trend badge HTML
  const trendHtml = renderTrendBadge(trend, subtitleFontSize, trendUpColor, trendDownColor);
  const hasSideIcon = !!iconHtml && (iconPosition === 'left' || iconPosition === 'right');
  const titleHtml = `
    <div data-value-card-title="true" style="
      font-size: ${titleSize}px;
      color: ${titleColor};
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    ">
      ${escapeHtml(title)}
    </div>
  `;
  const valueHtml = `
    <div data-value-card-value="true" style="
      display: flex;
      align-items: baseline;
      gap: 4px;
      line-height: 1.2;
      font-feature-settings: 'tnum';
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      min-width: 0;
      justify-content: ${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'};
    ">
      ${
        prefix
          ? `
        <span style="font-size: ${unitSize}px; color: ${valueColor}; opacity: 0.8;">
          ${escapeHtml(prefix)}
        </span>
      `
          : ''
      }
      <span style="min-width:0; overflow:hidden; text-overflow:ellipsis; font-size: ${mainValueSize}px; font-weight: 600; color: ${valueColor};">
        ${escapeHtml(displayValue)}
      </span>
      ${
        displaySuffix
          ? `
        <span style="font-size: ${unitSize}px; color: ${valueColor}; opacity: 0.8;">
          ${escapeHtml(displaySuffix)}
        </span>
      `
          : ''
      }
    </div>
  `;
  const subtitleHtml = subtitle
    ? `
    <div data-value-card-subtitle="true" style="
      font-size: ${subTitleSize}px;
      color: ${subtitleColor};
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    ">
      ${escapeHtml(subtitle)}
    </div>
  `
    : '';
  const textContentHtml = `
    <div data-value-card-content="true" style="
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: ${Math.max(4, Math.min(contentGap, Math.round(mainValueSize * 0.28)))}px;
      align-items: ${alignItems};
      text-align: ${textAlign};
      width: 100%;
    ">
      ${titleHtml}
      ${valueHtml}
      ${hasSideIcon && trendHtml ? trendHtml : ''}
      ${subtitleHtml}
    </div>
  `;

  // Row 1 visibility: only render when icon or trend exists
  const hasRow1 = !hasSideIcon && (iconHtml || trendHtml);

  // HTML Structure — 4-row layout per spec v2
  element.innerHTML = `
    <div data-value-card-layout="${hasSideIcon ? 'side' : 'stacked'}" style="
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: ${contentGap}px;
      align-items: ${alignItems};
      text-align: ${textAlign};
      color: ${valueColor};
      min-width: 0;
    ">
      ${
        hasSideIcon
          ? `
        <div data-value-card-side-row="true" style="
          display: flex;
          align-items: center;
          justify-content: ${align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'};
          gap: clamp(12px, 4%, 24px);
          width: 100%;
          min-width: 0;
        ">
          ${iconPosition === 'left' ? iconHtml : ''}
          ${textContentHtml}
          ${iconPosition === 'right' ? iconHtml : ''}
        </div>
      `
          : ''
      }

      ${
        !hasSideIcon
          ? `
      ${
        hasRow1
          ? `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        ">
          ${iconHtml}
          ${trendHtml}
        </div>
      `
          : ''
      }

      ${titleHtml}
      ${valueHtml}
      ${subtitleHtml}
      `
          : ''
      }
    </div>
  `;

  if (iconComponent) {
    const iconSlot = element.querySelector(ICON_SLOT_SELECTOR);
    if (iconSlot instanceof HTMLElement) {
      const iconRoot = createRoot(iconSlot);
      iconRoot.render(
        createElement(iconComponent, {
          size: iconGlyphSize,
          color: iconColor,
          strokeWidth: DEFAULT_ICON_STROKE_WIDTH,
        }),
      );
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
    let currentCtx = ctx;
    let colors = resolveWidgetColors(element);
    let iconRoot: Root | null = null;
    const pendingIconRoots = new Set<Root>();
    let iconRootUnmountScheduled = false;
    let themeObserver: MutationObserver | null = null;

    // React warns when a root is synchronously unmounted while another React
    // tree is rendering. Overlay updates can be re-entrant with that render,
    // so flush icon root cleanup after the current call stack completes.
    const scheduleIconRootUnmount = (root: Root | null) => {
      if (!root) return;
      pendingIconRoots.add(root);
      if (iconRootUnmountScheduled) return;

      iconRootUnmountScheduled = true;
      const flush = () => {
        iconRootUnmountScheduled = false;
        const roots = Array.from(pendingIconRoots);
        pendingIconRoots.clear();
        roots.forEach((pendingRoot) => pendingRoot.unmount());
      };

      if (typeof queueMicrotask === 'function') {
        queueMicrotask(flush);
      } else {
        Promise.resolve().then(flush);
      }
    };

    const renderWidget = () => {
      const previousIconRoot = iconRoot;
      iconRoot = null;
      scheduleIconRootUnmount(previousIconRoot);
      iconRoot = renderCard(element, currentProps, colors, currentCtx);
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

    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderWidget();
      });
      themeObserver.observe(themeTarget, {
        attributes: true,
        attributeFilter: ['data-canvas-theme'],
      });
    }

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentCtx = newCtx;
        colors = resolveWidgetColors(element);
        renderWidget();
      },
      destroy: () => {
        const currentIconRoot = iconRoot;
        iconRoot = null;
        scheduleIconRootUnmount(currentIconRoot);
        ro?.disconnect();
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
