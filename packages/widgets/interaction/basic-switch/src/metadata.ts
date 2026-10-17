export const metadata = {
  id: 'interaction/basic-switch',
  name: 'Switch',
  category: 'interaction',
  icon: 'ToggleLeft',
  version: '2.1.0',
  // Give the icon, label, and switch enough room in the default horizontal layout.
  defaultSize: { width: 260, height: 80 },
  resizable: true,
  constraints: { minWidth: 120, minHeight: 70 },
} as const;
