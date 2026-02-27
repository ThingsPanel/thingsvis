export type WidgetColors = {
    bg: string;
    fg: string;
    axis: string;
    primary: string;
};

/**
 * 提取元素的 CSS 自定义属性构成的图表色板
 * Canvas 图表 (ECharts, uPlot) 通常不支持 CSS Variables，
 * 该工具在 Widget 挂载和更新时动态提取真实的渲染色，实现零 JS 主题切换。
 *
 * @param element 所在的挂载点 DOM 容器
 */
export function resolveWidgetColors(element: HTMLElement): WidgetColors {
    if (typeof window === 'undefined') {
        return { bg: 'transparent', fg: '#333', axis: '#00000010', primary: '#1677ff' };
    }
    const computed = window.getComputedStyle(element);

    const getVar = (name: string, fallback: string) => {
        const val = computed.getPropertyValue(name).trim();
        if (val) {
            // Handle Tailwind style space-separated HSL values (e.g., "240 10% 15%" or "255 255 255 0.15")
            // and convert them to valid standard CSS color strings like "hsla(240, 10%, 15%, 0.15)" or "hsl(...)"
            const parts = val.split(/\s+/).filter(p => p !== '/');
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
        bg: getVar('--w-bg', 'transparent'),
        fg: getVar('--w-fg', '#333'), // 默认暗色字
        axis: getVar('--w-axis', '#00000010'), // 默认轴线颜色
        primary: getVar('--w-primary', '#1677ff'),
    };
}
