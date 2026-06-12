import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

type PlatformDevice = Record<string, unknown>;

type PagedTableState = {
  currentPage: number;
  total: number;
  rows: PlatformDevice[];
  loading: boolean;
  error: string;
  activeReqId: string;
};

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
    const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const num = Number.parseInt(fullHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch?.[1]) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
  }
  return normalized;
}

function formatOnlineStatus(value: unknown): string {
  if (value === 1 || value === '1' || value === true) return '在线';
  if (value === 0 || value === '0' || value === false) return '离线';
  return value === undefined || value === null || value === '' ? '--' : String(value);
}

function resolveCellValue(row: PlatformDevice, key: string): string {
  if (key === 'isOnline' || key === 'status') {
    return formatOnlineStatus(row.isOnline ?? row.status);
  }
  const value = row[key];
  if (value === undefined || value === null) return '';
  return String(value);
}

function canRequestHost(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

function requestPagedDevices(props: Props, state: PagedTableState, reqId: string) {
  if (!canRequestHost()) {
    state.loading = false;
    state.error = '需在平台看板中预览';
    state.rows = [];
    state.total = 0;
    return;
  }

  state.loading = true;
  state.error = '';
  state.activeReqId = reqId;

  window.parent.postMessage(
    {
      type: 'thingsvis:searchDevicesPaged',
      payload: {
        reqId,
        keyword: props.keyword?.trim() || '',
        groupId: props.groupId || '__all__',
        deviceConfigId: props.deviceConfigId || '',
        page: state.currentPage,
        pageSize: props.pageSize,
      },
    },
    '*',
  );
}

function renderPagedTable(
  element: HTMLElement,
  props: Props,
  colors: WidgetColors,
  state: PagedTableState,
  onPageChange: (page: number) => void,
): void {
  const {
    columns,
    showHeader,
    headerFontSize,
    headerWeight,
    headerColor,
    headerBgColor,
    bodyFontSize,
    bodyWeight,
    bodyColor,
    showBorder,
    rowBorderColor,
    showStripe,
    stripeColor,
    cellPadding,
    scrollEnabled,
  } = props;

  const rowBorderColorRaw =
    rowBorderColor || (props as unknown as { borderColor?: string }).borderColor || 'auto';

  const textPrimary = colors.fg;
  const textSecondary = withAlpha(textPrimary, 0.75);
  const borderColor =
    rowBorderColorRaw === 'auto' || !rowBorderColorRaw ? withAlpha(textPrimary, 0.08) : rowBorderColorRaw;
  const rowHoverBg = withAlpha(textPrimary, 0.04);
  const finalHeaderColor = headerColor === 'auto' ? textSecondary : headerColor;
  const finalHeaderBgColor = headerBgColor === 'auto' ? withAlpha(textPrimary, 0.06) : headerBgColor;
  const finalBodyColor = bodyColor === 'auto' ? textPrimary : bodyColor;
  const finalStripeColor = stripeColor === 'auto' ? withAlpha(textPrimary, 0.02) : stripeColor;
  const scrollOverflow = scrollEnabled !== false ? 'auto' : 'hidden';
  const totalPages = Math.max(1, Math.ceil(state.total / Math.max(1, props.pageSize)));

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
    -webkit-font-smoothing: antialiased;
  `;

  let html = '';

  html += `<div style="flex:1 1 0;min-height:0;min-width:0;overflow:${scrollOverflow};-webkit-overflow-scrolling:touch;position:relative;">`;
  if (state.loading) {
    html += `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:${withAlpha(colors.bg || '#000', 0.35)};color:${textSecondary};font-size:13px;z-index:2;">加载中...</div>`;
  }

  html += `<table style="width:100%;border-collapse:collapse;table-layout:auto;">`;

  if (showHeader && columns?.length) {
    html += '<thead><tr>';
    columns.forEach((col: { key?: string; title?: string; align?: string }) => {
      html += `<th style="text-align:${col.align || 'left'};padding:${cellPadding}px;font-weight:${headerWeight};font-size:${headerFontSize}px;color:${finalHeaderColor};background:${finalHeaderBgColor};border-bottom:${showBorder ? `1px solid ${borderColor}` : 'none'};white-space:nowrap;">${escapeHtml(col.title || col.key)}</th>`;
    });
    html += '</tr></thead>';
  }

  html += '<tbody>';
  if (state.error) {
    html += `<tr><td colspan="${columns?.length || 1}" style="padding:${cellPadding}px;text-align:center;color:${textSecondary};font-style:italic;">${escapeHtml(state.error)}</td></tr>`;
  } else if (state.rows.length && columns?.length) {
    state.rows.forEach((row, index) => {
      const isStripe = showStripe && index % 2 === 1;
      const defaultBg = isStripe ? finalStripeColor : 'transparent';
      html += `<tr style="background:${defaultBg};" onmouseover="this.style.background='${rowHoverBg}'" onmouseout="this.style.background='${defaultBg}'">`;
      columns.forEach((col: { key?: string; align?: string }) => {
        const value = resolveCellValue(row, String(col.key || ''));
        html += `<td style="text-align:${col.align || 'left'};padding:${cellPadding}px;color:${finalBodyColor};font-weight:${bodyWeight};font-size:${bodyFontSize}px;border-bottom:${showBorder ? `1px solid ${borderColor}` : 'none'};white-space:nowrap;">${escapeHtml(value)}</td>`;
      });
      html += '</tr>';
    });
  } else if (!state.loading) {
    html += `<tr><td colspan="${columns?.length || 1}" style="padding:${cellPadding}px;text-align:center;color:${textSecondary};font-style:italic;">暂无数据</td></tr>`;
  }
  html += '</tbody></table></div>';

  const prevDisabled = state.currentPage <= 1 || state.loading;
  const nextDisabled = state.currentPage >= totalPages || state.loading;
  html += `<div data-tv-pager style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 4px 0;font-size:12px;color:${textSecondary};">
    <span>共 ${state.total} 条 · 第 ${state.currentPage}/${totalPages} 页</span>
    <div style="display:flex;gap:6px;">
      <button type="button" data-tv-page="prev" ${prevDisabled ? 'disabled' : ''} style="padding:4px 10px;border:1px solid ${borderColor};background:transparent;color:${textPrimary};border-radius:4px;cursor:${prevDisabled ? 'not-allowed' : 'pointer'};opacity:${prevDisabled ? 0.5 : 1};">上一页</button>
      <button type="button" data-tv-page="next" ${nextDisabled ? 'disabled' : ''} style="padding:4px 10px;border:1px solid ${borderColor};background:transparent;color:${textPrimary};border-radius:4px;cursor:${nextDisabled ? 'not-allowed' : 'pointer'};opacity:${nextDisabled ? 0.5 : 1};">下一页</button>
    </div>
  </div>`;

  element.innerHTML = html;

  const prevBtn = element.querySelector<HTMLButtonElement>('button[data-tv-page="prev"]');
  const nextBtn = element.querySelector<HTMLButtonElement>('button[data-tv-page="next"]');
  prevBtn?.addEventListener('click', () => {
    if (state.currentPage > 1) onPageChange(state.currentPage - 1);
  });
  nextBtn?.addEventListener('click', () => {
    if (state.currentPage < totalPages) onPageChange(state.currentPage + 1);
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

  render: (element: HTMLElement, props: Props, _ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    let reqSeq = 0;

    const state: PagedTableState = {
      currentPage: 1,
      total: 0,
      rows: [],
      loading: false,
      error: '',
      activeReqId: '',
    };

    const redraw = () => {
      renderPagedTable(element, currentProps, colors, state, (page) => {
        state.currentPage = page;
        const reqId = `paged-table-${Date.now()}-${++reqSeq}`;
        requestPagedDevices(currentProps, state, reqId);
        redraw();
      });
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: Record<string, unknown> } | undefined;
      if (data?.type !== 'tv:search-devices-paged-result') return;
      const payload = data.payload;
      if (!payload || payload.reqId !== state.activeReqId) return;

      state.loading = false;
      state.rows = Array.isArray(payload.devices) ? (payload.devices as PlatformDevice[]) : [];
      state.total = typeof payload.total === 'number' ? payload.total : 0;
      if (typeof payload.page === 'number' && payload.page > 0) {
        state.currentPage = payload.page;
      }
      redraw();
    };

    window.addEventListener('message', handleMessage);

    const reqId = `paged-table-${Date.now()}-${++reqSeq}`;
    requestPagedDevices(currentProps, state, reqId);
    redraw();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        redraw();
      });
      ro.observe(element);
    }

    return {
      update: (newProps: Props) => {
        const pageSizeChanged = newProps.pageSize !== currentProps.pageSize;
        const filterChanged =
          newProps.groupId !== currentProps.groupId ||
          newProps.keyword !== currentProps.keyword ||
          newProps.deviceConfigId !== currentProps.deviceConfigId;

        currentProps = newProps;
        colors = resolveWidgetColors(element);

        if (pageSizeChanged || filterChanged) {
          state.currentPage = 1;
        }

        const nextReqId = `paged-table-${Date.now()}-${++reqSeq}`;
        requestPagedDevices(currentProps, state, nextReqId);
        redraw();
      },
      destroy: () => {
        window.removeEventListener('message', handleMessage);
        ro?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
