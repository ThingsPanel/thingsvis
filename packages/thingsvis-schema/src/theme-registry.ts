import { z } from 'zod';

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
    swatch: ['transparent', '#ffffff', '#0f6cbd', '#107c10', '#5c2d91'],
  },
  midnight: {
    id: 'midnight',
    i18nKey: 'canvas.themeMidnight',
    fallbackLabel: 'Midnight',
    group: 'dark' as const,
    swatch: ['#111827', '#1f2937', '#60a5fa', '#4ade80', '#c4b5fd'],
  },
  ocean: {
    id: 'ocean',
    i18nKey: 'canvas.themeOcean',
    fallbackLabel: 'Ocean',
    group: 'dark' as const,
    swatch: ['#0b1f33', '#102a43', '#38bdf8', '#2dd4bf', '#c4b5fd'],
  },
  ember: {
    id: 'ember',
    i18nKey: 'canvas.themeEmber',
    fallbackLabel: 'Amber',
    group: 'dark' as const,
    swatch: ['#201a13', '#2b241c', '#f59e0b', '#fdba74', '#c4b5fd'],
  },
  frost: {
    id: 'frost',
    i18nKey: 'canvas.themeFrost',
    fallbackLabel: 'Frost',
    group: 'dark' as const,
    swatch: ['#0b1220', '#162033', '#93c5fd', '#5eead4', '#c4b5fd'],
  },
} as const;

/** All registered theme IDs */
export type CanvasThemeId = keyof typeof CANVAS_THEMES;

/** Theme group for categorizing themes in UI */
export type CanvasThemeGroup = 'light' | 'dark';

/** Themes removed from the picker map to their closest supported neutral theme. */
const LEGACY_THEME_ALIASES: Record<string, CanvasThemeId> = {
  aurora: 'dawn',
  frostLight: 'dawn',
};

/** Default theme applied to new projects */
export const DEFAULT_CANVAS_THEME: CanvasThemeId = 'dawn';

/** Ordered list of theme IDs (for UI rendering) */
export const CANVAS_THEME_IDS = Object.keys(CANVAS_THEMES) as CanvasThemeId[];

/**
 * Page-level semantic token overrides.  These are intentionally role-based:
 * users can tune a dashboard's visual language without reaching into widget
 * implementation details or persisting arbitrary CSS declarations.
 */
export const CanvasThemeOverridesSchema = z
  .object({
    bg: z.string().min(1).optional(),
    surface: z.string().min(1).optional(),
    surfaceBorder: z.string().min(1).optional(),
    surfaceShadow: z.string().min(1).optional(),
    fg: z.string().min(1).optional(),
    textPrimary: z.string().min(1).optional(),
    textSecondary: z.string().min(1).optional(),
    textMuted: z.string().min(1).optional(),
    axis: z.string().min(1).optional(),
    primary: z.string().min(1).optional(),
    border: z.string().min(1).optional(),
    series1: z.string().min(1).optional(),
    series2: z.string().min(1).optional(),
    series3: z.string().min(1).optional(),
    series4: z.string().min(1).optional(),
    series5: z.string().min(1).optional(),
    series6: z.string().min(1).optional(),
    statusOnline: z.string().min(1).optional(),
    statusWarning: z.string().min(1).optional(),
    statusOffline: z.string().min(1).optional(),
    statusMaintenance: z.string().min(1).optional(),
    statusCritical: z.string().min(1).optional(),
    statusInfo: z.string().min(1).optional(),
    statusSuccess: z.string().min(1).optional(),
  })
  .partial();

export type CanvasThemeOverrides = z.infer<typeof CanvasThemeOverridesSchema>;

/**
 * Validate and safely resolve a theme ID.
 * Unknown values fall back to DEFAULT_CANVAS_THEME.
 */
export function validateCanvasTheme(themeValue: unknown): CanvasThemeId {
  if (typeof themeValue === 'string' && themeValue in LEGACY_THEME_ALIASES) {
    return LEGACY_THEME_ALIASES[themeValue]!;
  }
  if (typeof themeValue === 'string' && themeValue in CANVAS_THEMES) {
    return themeValue as CanvasThemeId;
  }
  return DEFAULT_CANVAS_THEME;
}
