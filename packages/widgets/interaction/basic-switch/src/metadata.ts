export const metadata = {
  id: 'interaction/basic-switch',
  name: 'Switch',
  category: 'interaction',
  icon: 'ToggleLeft',
  version: '2.1.0',
  // Keep the switch control compact inside its resizable widget.
  defaultSize: { width: 160, height: 80 },
  resizable: true,
  constraints: { minWidth: 120, minHeight: 70 },
} as const;
