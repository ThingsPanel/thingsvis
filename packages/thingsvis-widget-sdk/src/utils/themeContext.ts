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

    // Helper 以修剪由于 css variable 设置可能产生的空格
    const getVar = (name: string, fallback: string) => {
        const val = computed.getPropertyValue(name).trim();
        // 可能是 HSL 格式的数值如 "140 50% 10%" 或者是 hex
        // 我们约定如果是 hsl(var(--xx)) 在此处无法直接消费，
        // 为了支持 ECharts 最简单的方式是 CSS 里同时给到 rgb / hex 对应的变量，或者我们在此组合
        // 对于 HSL 如果没带 hsl() 需要补足
        if (val) {
            if (/^[0-9]+(\.[0-9]+)?\s+[0-9]+(\.[0-9]+)?%\s+[0-9]+(\.[0-9]+)?%/.test(val)) {
                return `hsl(${val})`;
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
