import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

type RuntimeMessages = {
  runtime?: {
    emptyState?: string;
  };
};

function getRuntimeMessages(locale?: string): RuntimeMessages {
  return locale?.toLowerCase().startsWith('zh') ? (zh as RuntimeMessages) : (en as RuntimeMessages);
}

// ============================================================================
// Apple Flat Design Table - Clean & Minimal
// ============================================================================

function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function withAlpha(color: string, alpha: number): string {
  if (color === 'auto') return color;
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

// ============================================================================
// Render
// ============================================================================

function renderTable(
  element: HTMLElement,
  props: Props,
  colors: WidgetColors,
  locale?: string,
): void {
  const {
    columns, data, 
    showHeader, headerFontSize, headerWeight, headerColor, headerBgColor,
    bodyFontSize, bodyWeight, bodyColor, showBorder, showStripe, stripeColor,
    cellPadding
  } = props;
  const runtimeMessages = getRuntimeMessages(locale);
  
  // Resolve Auto Colors
  const textPrimary = colors.fg;
  const textSecondary = withAlpha(textPrimary, 0.75);
  const borderColor = withAlpha(textPrimary, 0.08);
  const rowHoverBg = withAlpha(textPrimary, 0.04);
  
  const finalHeaderColor = headerColor === 'auto' ? textSecondary : headerColor;
  const finalHeaderBgColor = headerBgColor === 'auto' ? withAlpha(textPrimary, 0.06) : headerBgColor;
  const finalBodyColor = bodyColor === 'auto' ? textPrimary : bodyColor;
  const finalStripeColor = stripeColor === 'auto' ? withAlpha(textPrimary, 0.02) : stripeColor;
  
  // 外层容器 - 保证弹性填充
  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: inherit;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;
  
  // Build table HTML
  // table-layout: fixed 和 height: 100% 组合使其行高均匀撑满父级
  let tableHtml = `<table style="
    width: 100%;
    height: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 0;
  ">`;
  
  // Header
  if (showHeader && columns?.length) {
    tableHtml += '<thead>';
    tableHtml += '<tr>';
    columns.forEach((col: any) => {
      const title = col.title || col.key;
      tableHtml += `<th style="
        text-align: ${col.align || 'left'};
        padding: ${cellPadding}px;
        font-weight: ${headerWeight};
        font-size: ${headerFontSize}px;
        color: ${finalHeaderColor};
        background: ${finalHeaderBgColor};
        border-bottom: ${showBorder ? `1px solid ${borderColor}` : 'none'};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${escapeHtml(title)}</th>`;
    });
    tableHtml += '</tr>';
    tableHtml += '</thead>';
  }
  
  // Body
  tableHtml += '<tbody>';
  if (data?.length && columns?.length) {
    data.forEach((row: any, index: number) => {
      const isStripe = showStripe && index % 2 === 1;
      const defaultBg = isStripe ? finalStripeColor : 'transparent';
      
      tableHtml += `<tr style="
        background: ${defaultBg};
        transition: background 0.15s ease;
      " onmouseover="this.style.background='${rowHoverBg}'" onmouseout="this.style.background='${defaultBg}'">`;
      
      columns.forEach((col: any) => {
        const value = row[col.key] !== undefined ? String(row[col.key]) : '';
        const align = col.align || 'left';
        tableHtml += `<td style="
          text-align: ${align};
          padding: ${cellPadding}px;
          color: ${finalBodyColor};
          font-weight: ${bodyWeight};
          font-size: ${bodyFontSize}px;
          border-bottom: ${showBorder ? `1px solid ${borderColor}` : 'none'};
          font-feature-settings: 'tnum';
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${escapeHtml(value)}</td>`;
      });
      
      tableHtml += '</tr>';
    });
  } else {
    // Empty state
    const colCount = columns?.length || 1;
    tableHtml += `<tr><td colspan="${colCount}" style="
      padding: ${cellPadding}px;
      text-align: center;
      color: ${textSecondary};
      font-style: italic;
    ">${runtimeMessages.runtime?.emptyState || 'Add rows or bind a table data set'}</td></tr>`;
  }
  tableHtml += '</tbody>';
  
  tableHtml += '</table>';
  
  element.innerHTML = tableHtml;
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
    
    renderTable(element, currentProps, colors, ctx.locale);
    
    // Resize observer for theme updates
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderTable(element, currentProps, colors, ctx.locale);
      });
      ro.observe(element);
    }
    
    return {
      update: (newProps: Props) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderTable(element, currentProps, colors, ctx.locale);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      }
    };
  }
});

export default Main;
