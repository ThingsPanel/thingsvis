export const metadata = {
  id: 'svg-symbol',
  name: '图形符号',
  category: 'industrial',
  icon: 'Shapes',
  version: '1.0.0',
  // Match default icon (iot-device) 1:1 aspect ratio.
  defaultSize: { width: 80, height: 80 },
  constraints: { minWidth: 40, minHeight: 40 },
  resizable: true,
} as const;
