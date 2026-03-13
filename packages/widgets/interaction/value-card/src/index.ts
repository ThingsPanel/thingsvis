import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
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

// ============================================================================
// Render
// ============================================================================
function renderCard(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const {
    title, value, suffix, subtitle, precision,
    titleFontSize, valueFontSize, suffixFontSize, subtitleFontSize,
    align
  } = props;

  const width = Math.max(element.clientWidth || DEFAULT_CARD_WIDTH, DEFAULT_CARD_WIDTH);
  const height = Math.max(element.clientHeight || DEFAULT_CARD_HEIGHT, DEFAULT_CARD_HEIGHT);
  const scale = Math.max(1, Math.min(1.8, Math.min(width / DEFAULT_CARD_WIDTH, height / DEFAULT_CARD_HEIGHT)));
  const paddingX = DEFAULT_CARD_PADDING_X;
  const paddingY = DEFAULT_CARD_PADDING_Y;
  const titleSize = Math.round(titleFontSize * scale);
  const mainValueSize = Math.round(valueFontSize * scale);
  const unitSize = Math.round(suffixFontSize * scale);
  const subTitleSize = Math.round(subtitleFontSize * scale);
  const contentGap = Math.max(6, Math.round(8 * scale));

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

  // HTML Structure
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
    
    renderCard(element, currentProps, colors);
    
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderCard(element, currentProps, colors);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderCard(element, currentProps, colors);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
