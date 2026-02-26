import 'uplot/dist/uPlot.min.css';
import uPlot from 'uplot';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';

export const Main = defineWidget({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    icon: metadata.icon,
    version: metadata.version,
    locales: metadata.locales,
    schema: PropsSchema,
    controls,
    render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
        let currentProps = props;
        let isDark = (ctx as any).theme?.isDark ?? false;

        const textColor = isDark ? '#ddd' : '#333';
        const gridColor = isDark ? '#ffffff20' : '#00000010';

        let chart: uPlot | null = null;

        const titleEl = document.createElement('div');
        titleEl.style.textAlign = 'center';
        titleEl.style.fontSize = '14px';
        titleEl.style.fontWeight = 'bold';
        titleEl.style.marginBottom = '8px';
        titleEl.style.color = textColor;
        element.appendChild(titleEl);

        const chartContainer = document.createElement('div');
        chartContainer.style.width = '100%';
        chartContainer.style.height = 'calc(100% - 22px)';
        element.appendChild(chartContainer);

        const initChart = () => {
            if (chart) {
                chart.destroy();
            }

            const { title, primaryColor, showLegend, data } = currentProps;
            titleEl.textContent = title || '';
            titleEl.style.display = title ? 'block' : 'none';

            let topPadding = 10;
            if (title) {
                chartContainer.style.height = 'calc(100% - 22px)';
                topPadding = 5;
            } else {
                chartContainer.style.height = '100%';
                topPadding = 20;
            }

            // data conversion: [{time: timestamp, value: num}] -> [[timestamps], [values]]
            let times: number[] = [];
            let values: number[] = [];

            if (Array.isArray(data)) {
                data.forEach(d => {
                    if (d.time && d.value !== undefined) {
                        times.push(Math.round(new Date(d.time).getTime() / 1000));
                        values.push(Number(d.value));
                    }
                });
            } else {
                times = [Date.now() / 1000];
                values = [0];
            }

            // Generate prettier default data if only 3 points (like new instance)
            if (times.length <= 3) {
                times = [];
                values = [];
                const now = Math.floor(Date.now() / 1000);
                for (let i = 0; i < 60; i++) {
                    times.push(now - (60 - i) * 60); // past 60 mins
                    // Random-ish walk that looks like CPU/Metric usage
                    values.push(20 + Math.sin(i * 0.2) * 15 + Math.random() * 5);
                }
            }

            // Always ensure monotonically increasing times
            const sortedIndices = times.map((t, i) => i).sort((a, b) => times[a]! - times[b]!);
            const finalTimes = sortedIndices.map(i => times[i]!);
            const finalValues = sortedIndices.map(i => values[i]!);

            const chartData: uPlot.AlignedData = [
                finalTimes,
                finalValues
            ];

            const cw = chartContainer.clientWidth || 300;
            const ch = chartContainer.clientHeight || 200;
            const minDim = Math.min(cw, ch);
            const scale = Math.max(0.6, Math.min(1.5, minDim / 300));

            titleEl.style.fontSize = `${Math.round(14 * scale)}px`;
            titleEl.style.marginBottom = `${Math.round(8 * scale)}px`;

            const axisFontSize = Math.round(12 * scale);
            const axisFont = `${axisFontSize}px system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

            const opts: uPlot.Options = {
                width: cw,
                height: ch,
                padding: [topPadding, 20, 20, 20],
                legend: {
                    show: !!showLegend,
                },
                axes: [
                    {
                        stroke: textColor,
                        font: axisFont,
                        space: 100 * scale, // 动态增加刻度之间的最小间距，防止文字重叠
                        grid: { stroke: gridColor, width: 1 },
                        ticks: { stroke: gridColor, width: 1 }
                    },
                    {
                        stroke: textColor,
                        font: axisFont,
                        grid: { stroke: gridColor, width: 1, dash: [5, 5] },
                        ticks: { stroke: gridColor, width: 0 }
                    }
                ],
                series: [
                    {},
                    {
                        label: title || "数值",
                        stroke: primaryColor,
                        fill: primaryColor + "30", // deeper slightly for area
                        width: 2,
                        // Enable smooth bezier curves
                        paths: uPlot.paths.spline ? uPlot.paths.spline() : undefined,
                        points: {
                            show: false // Hide dots to look cleaner, similar to Grafana default
                        }
                    }
                ],
                cursor: {
                    points: {
                        size: 6,
                        fill: primaryColor,
                        stroke: textColor
                    }
                }
            };

            chart = new uPlot(opts, chartData, chartContainer);
        };

        let ro: ResizeObserver | null = null;
        let lastScale = -1;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                if (chart) {
                    const cw = chartContainer.clientWidth || 300;
                    const ch = chartContainer.clientHeight || 200;
                    const minDim = Math.min(cw, ch);
                    const newScale = Math.max(0.6, Math.min(1.5, minDim / 300));

                    // If scale significantly changed, we must re-init to update canvas text fonts
                    if (Math.abs(newScale - lastScale) > 0.05 && lastScale !== -1) {
                        lastScale = newScale;
                        initChart();
                    } else {
                        chart.setSize({ width: cw, height: ch });
                    }
                }
            });
            ro.observe(chartContainer);
        }

        const scheduleInit = () => {
            requestAnimationFrame(() => {
                const cw = chartContainer.clientWidth || 300;
                const ch = chartContainer.clientHeight || 200;
                lastScale = Math.max(0.6, Math.min(1.5, Math.min(cw, ch) / 300));
                initChart();
            });
        };

        scheduleInit();

        return {
            update: (newProps: Props, newCtx: WidgetOverlayContext) => {
                currentProps = newProps;
                isDark = (newCtx as any).theme?.isDark ?? false;

                titleEl.style.color = isDark ? '#ddd' : '#333';

                initChart();
            },
            destroy: () => {
                ro?.disconnect();
                if (chart) {
                    chart.destroy();
                }
            },
        };
    }
});

export default Main;
