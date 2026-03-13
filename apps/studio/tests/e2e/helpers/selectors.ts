export const editorSelectors = {
  canvas: '[data-testid="studio-canvas"]',
  componentsList: '[data-testid="components-list"]',
  componentsSearch: '[data-testid="components-search"]',
  componentCard: '[data-testid="component-card"]',
  layerPanel: '[data-testid="layer-panel"]',
} as const;

export function componentCardSelector(componentId: string): string {
  return `${editorSelectors.componentCard}[data-component-id="${componentId}"]`;
}
