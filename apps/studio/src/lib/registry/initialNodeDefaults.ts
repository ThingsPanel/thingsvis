import type { GridSettings, IBaseStyle } from '@thingsvis/schema';

export type InitialNodeSize = { width: number; height: number };

export type InitialGridSettings = Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'> & {
  containerWidth: number;
};

/**
 * A node must have exactly one visual surface owner. Host-owned widgets receive
 * the canvas card surface; controls and decorative/media widgets render their
 * own surface (or none) and must not acquire a second outer frame by default.
 */
export const HOST_SURFACE_WIDGET_TYPES = new Set([
  // Data cards render content only; the host supplies their themed surface.
  'interaction/value-card',
  'interaction/value-card-simple',
  // Charts share the host surface so theme, spacing and hierarchy are consistent.
  'chart/echarts-bar',
  'chart/echarts-gauge',
  'chart/echarts-line',
  'chart/echarts-pie',
  'chart/uplot-line',
  'chart/realtime-history-curve',
]);

/** Controls already own focus, border and state affordances. */
export const SELF_SURFACE_WIDGET_TYPES = new Set([
  'interaction/basic-button',
  'interaction/basic-input',
  'interaction/basic-progress',
  'interaction/basic-select',
  'interaction/basic-slider',
  'interaction/basic-switch',
  'interaction/date-range-picker',
  'interaction/quick-entry-list',
  'interaction/toggle-button',
]);

export type WidgetSurfaceOwner = 'host' | 'self' | 'none';

export function resolveWidgetSurfaceOwner(widgetType?: string): WidgetSurfaceOwner {
  if (widgetType && HOST_SURFACE_WIDGET_TYPES.has(widgetType)) return 'host';
  if (widgetType && SELF_SURFACE_WIDGET_TYPES.has(widgetType)) return 'self';
  return 'none';
}

/** Defaults owned by the editor for a newly inserted library widget. */
export function createDefaultWidgetBaseStyle(widgetType?: string): IBaseStyle {
  const surfaceOwner = resolveWidgetSurfaceOwner(widgetType);

  return {
    opacity: 1,
    card: {
      enabled: surfaceOwner === 'host',
      appearance: 'auto',
      showSubtitle: false,
      titleFontSize: 16,
    },
  };
}

/**
 * Convert a widget's pixel default size into its authored grid dimensions.
 * The old drop paths used a fixed 4x3 (or a minimum 2x2) cell size, which made
 * compact controls render much larger than their widget metadata requested.
 */
export function resolveInitialGridPosition(
  size: InitialNodeSize | undefined,
  settings: InitialGridSettings,
  position: { x?: number; y?: number } = {},
  fallback: { w?: number; h?: number } = {},
) {
  const cols = Math.max(1, Math.trunc(settings.cols || 24));
  const gap = Math.max(0, settings.gap || 0);
  const rowHeight = Math.max(1, settings.rowHeight || 1);
  const containerWidth = Number(settings.containerWidth);
  const colWidth =
    Number.isFinite(containerWidth) && containerWidth > 0
      ? (containerWidth - (cols - 1) * gap) / cols
      : 0;
  const colStep = colWidth + gap;
  const rowStep = rowHeight + gap;
  const hasUsableSize = Boolean(size && size.width > 0 && size.height > 0 && colStep > 0);
  const w = hasUsableSize
    ? Math.max(1, Math.min(cols, Math.round((size!.width + gap) / colStep)))
    : Math.max(1, Math.min(cols, Math.trunc(fallback.w ?? 4)));
  const h = hasUsableSize
    ? Math.max(1, Math.round((size!.height + gap) / rowStep))
    : Math.max(1, Math.trunc(fallback.h ?? 2));

  const x = Math.max(0, Math.min(cols - w, Math.trunc(position.x ?? 0)));

  return {
    x,
    y: Math.max(0, Math.trunc(position.y ?? 0)),
    w,
    h,
    static: false,
    isDraggable: true,
    isResizable: true,
  };
}
