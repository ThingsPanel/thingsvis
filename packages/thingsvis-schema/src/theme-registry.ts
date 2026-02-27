export const CANVAS_THEMES = {
    dawn: {
        id: 'dawn',
        i18nKey: 'canvas.themeDawn',
        fallbackLabel: 'Dawn'
    },
    midnight: {
        id: 'midnight',
        i18nKey: 'canvas.themeMidnight',
        fallbackLabel: 'Midnight'
    }
} as const;

export type CanvasThemeId = keyof typeof CANVAS_THEMES;

export const DEFAULT_CANVAS_THEME: CanvasThemeId = 'dawn';

/**
 * 安全地验证并获取合法的主题 ID。
 * 如果传入的主题不存在于注册表中，将安全地回退到系统默认主题。
 */
export function validateCanvasTheme(themeValue: any): CanvasThemeId {
    // 有效性检查：如果是在注册表中声明的主题，则直接返回
    if (typeof themeValue === 'string' && CANVAS_THEMES[themeValue as CanvasThemeId]) {
        return themeValue as CanvasThemeId;
    }

    // 所有未知情况都统一回退到系统默认主题
    return DEFAULT_CANVAS_THEME;
}
