export const metadata = {
  id: 'interaction/basic-switch',
  name: 'Switch',
  category: 'interaction',
  icon: 'ToggleLeft',
  version: '2.1.0',
  // Match the default footprint of interaction/value-card-simple. The
  // switch control remains fixed-size inside this resizable card.
  defaultSize: { width: 160, height: 80 },
  resizable: true,
  constraints: { minWidth: 120, minHeight: 70 },
} as const;
