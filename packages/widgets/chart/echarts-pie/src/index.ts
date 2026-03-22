/**
 * ECharts 饼图主入口 (极致精简版 + 数据驱动)
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

function normalizePieData(data: Props['data']) {
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry) => {
        if (entry && typeof entry === 'object') {
            const record = entry as Record<string, unknown>;
            const name = record.name ?? record.label;
            const value = typeof record.value === 'number' ? record.value : Number(record.value);
            if (name != null && Number.isFinite(value) && value >= 0) {
                return [{ name: String(name), value }];
            }
        }
        return [];
    });
}

/**
 * 根据 Props 和 Theme 生成 ECharts Option
 */
function buildOption(props: Props, colors: WidgetColors, scale: number = 1): echarts.EChartsOption {
    const { title, data, showLegend, isDoughnut } = props;
    const normalizedData = normalizePieData(data);
    const hasData = normalizedData.length > 0;
    const compactMode = scale < 0.85 || normalizedData.length > 6;

    const textColor = colors.fg;

    return {
        backgroundColor: 'transparent',
        color: colors.series,
        graphic: hasData ? undefined : {
            type: 'text',
            left: 'center',
            top: 'middle',
            silent: true,
            style: {
                text: '暂无数据',
                fill: textColor,
                opacity: 0.65,
                fontSize: Math.round(14 * scale),
            },
        },
        title: title ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: Math.round(14 * scale), color: textColor },
            top: Math.round(10 * scale),
        } : undefined,
        tooltip: {
            trigger: 'item',
        },
        legend: {
            show: showLegend,
            bottom: 10,
            left: 'center',
            textStyle: { color: textColor, fontSize: Math.round(12 * scale) },
        },
        dataset: hasData ? {
            source: normalizedData
        } : undefined,
        series: hasData ? [
            {
                type: 'pie',
                radius: isDoughnut ? ['30%', '48%'] : '48%',
                center: ['50%', '45%'],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: colors?.bg ?? '#fff',
                    borderWidth: 2
                },
                encode: { value: 'value', itemName: 'name' }, // 明确指定 dataset 的字段映射
                labelLine: {
                    length: Math.round(10 * scale),
                    length2: Math.round(15 * scale),
                    smooth: true,
                },
                avoidLabelOverlap: true,
                minAngle: 10,
                label: {
                    color: textColor,
                    show: !compactMode,
                    fontSize: Math.max(10, Math.round(12 * scale)),
                    position: compactMode ? 'inside' : 'outer',
                    distanceToLabelLine: 5,
                    formatter: compactMode ? '{d}%' : '{b}: {d}%'
                }
            },
        ] : [],
    };
}

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    defaultSize: metadata.defaultSize,
    constraints: metadata.constraints,
    resizable: metadata.resizable,
    locales: { zh, en },
    schema: PropsSchema,
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let colors: WidgetColors = resolveWidgetColors(element);
        // Initialize ECharts
        const chart = echarts.init(element);
        chart.setOption(buildOption(currentProps, colors, 1));

        const scheduleResize = () => {
            try {
                requestAnimationFrame(() => {
                    if (!chart.isDisposed()) {
                        chart.resize();
                        const cw = element.clientWidth || 300;
                        const ch = element.clientHeight || 200;
                        const minDim = Math.min(cw, ch);
                        const scale = Math.max(0.6, Math.min(1.5, minDim / 300));
                        chart.setOption(buildOption(currentProps, colors, scale), { replaceMerge: ['dataset', 'series'] });
                    }
                });
            } catch {
                if (!chart.isDisposed()) chart.resize();
            }
        };

        scheduleResize();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => scheduleResize());
            ro.observe(element);
        }

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                colors = resolveWidgetColors(element);

                chart.setOption(buildOption(currentProps, colors), { replaceMerge: ['dataset', 'series'] });

                if (newCtx.size || !newCtx.size) {
                    scheduleResize();
                }
            },
            destroy: () => {
                ro?.disconnect();
                chart.dispose();
            },
        };
    }
});

export default Main;
