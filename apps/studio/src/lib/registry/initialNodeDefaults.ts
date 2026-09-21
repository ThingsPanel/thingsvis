import type { GridSettings, IBaseStyle } from '@thingsvis/schema';

export type InitialNodeSize = { width: number; height: number };

export type InitialGridSettings = Pick<GridSettings, 'cols' | 'rowHeight' | 'gap'> & {
  containerWidth: number;
};

/** Defaults owned by the editor for a newly inserted library widget. */
export function createDefaultWidgetBaseStyle(): IBaseStyle {
  // Keep the generator dependency-free. BaseStylePanel applies visual defaults
  // when users toggle the mode, while the persisted flag controls the default UI state.
  return {
    opacity: 1,
    card: { enabled: true, appearance: 'auto', showSubtitle: false, titleFontSize: 16 },
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
