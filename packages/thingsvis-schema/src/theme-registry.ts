/**
 * Canvas theme preset registry.
 * To add a new theme:
 *   1. Add an entry here
 *   2. Add matching CSS blocks in:
 *      - apps/studio/src/index.css (.theme-{id})
 *      - packages/thingsvis-ui/src/styles/canvas-themes.css ([data-canvas-theme="{id}"])
 *   3. Zero TypeScript code changes elsewhere.
 */
export const CANVAS_THEMES = {
  dawn: {
    id: 'dawn',
    i18nKey: 'canvas.themeDawn',
    fallbackLabel: 'Dawn',
    group: 'light' as const,
    swatch: ['#ffffff', '#1a1a2e', '#6965db', '#4ea8a6', '#e8945a'],
  },
  midnight: {
    id: 'midnight',
    i18nKey: 'canvas.themeMidnight',
    fallbackLabel: 'Midnight',
    group: 'dark' as const,
    swatch: ['#0f1729', '#c8d6f0', '#4e80ee', '#5b8def', '#3d6ad6'],
  },
  ocean: {
    id: 'ocean',
    i18nKey: 'canvas.themeOcean',
    fallbackLabel: 'Ocean',
    group: 'dark' as const,
    swatch: ['#0a192f', '#ccd6f6', '#64ffda', '#57cbff', '#ff6b9d'],
  },
  ember: {
    id: 'ember',
    i18nKey: 'canvas.themeEmber',
    fallbackLabel: 'Ember',
    group: 'dark' as const,
    swatch: ['#1a1020', '#f0e6ff', '#ff6b35', '#ffb366', '#ff4757'],
  },
  aurora: {
    id: 'aurora',
    i18nKey: 'canvas.themeAurora',
    fallbackLabel: 'Aurora',
    group: 'light' as const,
    swatch: ['#fafbfc', '#24292e', '#2188ff', '#28a745', '#6f42c1'],
  },
} as const;

/** All registered theme IDs */
export type CanvasThemeId = keyof typeof CANVAS_THEMES;

/** Theme group for categorizing themes in UI */
export type CanvasThemeGroup = 'light' | 'dark';

/** Default theme applied to new projects */
export const DEFAULT_CANVAS_THEME: CanvasThemeId = 'dawn';

/** Ordered list of theme IDs (for UI rendering) */
export const CANVAS_THEME_IDS = Object.keys(CANVAS_THEMES) as CanvasThemeId[];

/**
 * Validate and safely resolve a theme ID.
 * Unknown values fall back to DEFAULT_CANVAS_THEME.
 */
export function validateCanvasTheme(themeValue: unknown): CanvasThemeId {
  if (typeof themeValue === 'string' && themeValue in CANVAS_THEMES) {
    return themeValue as CanvasThemeId;
  }
  return DEFAULT_CANVAS_THEME;
}
