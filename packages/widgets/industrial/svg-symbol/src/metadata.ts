export const metadata = {
  id: 'svg-symbol',
  name: '图形符号',
  category: 'industrial',
  icon: 'Shapes',
  version: '1.0.0',
  // Match default icon (heat-exchanger) aspect ratio to avoid initial letterboxing.
  defaultSize: { width: 60, height: 100 },
  constraints: { minWidth: 40, minHeight: 40 },
  resizable: true,
} as const;
