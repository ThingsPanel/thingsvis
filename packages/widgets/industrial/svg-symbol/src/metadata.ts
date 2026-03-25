export const metadata = {
  id: 'svg-symbol',
  name: '图形符号',
  category: 'industrial',
  icon: 'Shapes',
  version: '1.0.0',
  // Reasonable default size for a single industrial symbol
  defaultSize: { width: 100, height: 100 },
  constraints: { minWidth: 40, minHeight: 40 },
  resizable: true,
} as const;
