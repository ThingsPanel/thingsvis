export const metadata = {
  id: 'svg-symbol',
  name: '图形符号',
  category: 'industrial',
  icon: 'Shapes',
  version: '1.0.0',
  // Default matches the most common horizontal symbol (100×60).
  // The canvas overrides this with IconEntry.defaultSize when a symbol is dropped.
  defaultSize: { width: 100, height: 60 },
  constraints: { minWidth: 40, minHeight: 40 },
  resizable: true,
} as const;
