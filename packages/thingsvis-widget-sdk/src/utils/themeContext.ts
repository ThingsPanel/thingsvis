/** Resolved color tokens from CSS custom properties */
export type WidgetColors = {
    bg: string;
    fg: string;
    axis: string;
    primary: string;
    border: string;
    /** 6-color data series palette for charts (ECharts option.color) */
    series: [string, string, string, string, string, string];
};

/** Dawn fallbacks (used when CSS custom properties are not available) */
const DAWN_FALLBACKS = {
    bg: 'transparent',
    fg: '#1a1a2e',
    axis: 'rgba(0, 0, 0, 0.08)',
    primary: '#6965db',
    border: 'rgba(0, 0, 0, 0.06)',
    series: ['#6965db', '#4ea8a6', '#e8945a', '#e05d6f', '#8b5cf6', '#0ea5e9'],
} as const;

/**
 * Extracts CSS custom property values to build a chart color palette.
 * Canvas charts (ECharts, uPlot) typically cannot consume CSS Variables
 * directly — this utility reads computed styles at mount/update time
 * to enable zero-JS theme switching.
 *
 * @param element The widget mount-point DOM container
 */
export function resolveWidgetColors(element: HTMLElement): WidgetColors {
    if (typeof window === 'undefined' || !element) {
        return {
            ...DAWN_FALLBACKS,
            series: [...DAWN_FALLBACKS.series] as WidgetColors['series'],
        };
    }
    const computed = window.getComputedStyle(element);

    const getVar = (name: string, fallback: string) => {
        const val = computed.getPropertyValue(name).trim();
        if (val) {
            // Handle legacy Tailwind-style space-separated HSL values
            const parts = val.split(/\s+/).filter((p) => p !== '/');
            if (parts.length >= 3 && parts[0] && /^[0-9.]/.test(parts[0])) {
                if (parts.length >= 4) {
                    return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${parts[3]})`;
                }
                return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
            }
            return val;
        }
        return fallback;
    };

    return {
        bg:      getVar('--w-bg',       DAWN_FALLBACKS.bg),
        fg:      getVar('--w-fg',       DAWN_FALLBACKS.fg),
        axis:    getVar('--w-axis',     DAWN_FALLBACKS.axis),
        primary: getVar('--w-primary',  DAWN_FALLBACKS.primary),
        border:  getVar('--w-border',   DAWN_FALLBACKS.border),
        series: [
            getVar('--w-series-1', DAWN_FALLBACKS.series[0]),
            getVar('--w-series-2', DAWN_FALLBACKS.series[1]),
            getVar('--w-series-3', DAWN_FALLBACKS.series[2]),
            getVar('--w-series-4', DAWN_FALLBACKS.series[3]),
            getVar('--w-series-5', DAWN_FALLBACKS.series[4]),
            getVar('--w-series-6', DAWN_FALLBACKS.series[5]),
        ],
    };
}
