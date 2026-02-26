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
            if (title) {
                chartContainer.style.height = 'calc(100% - 22px)';
            } else {
                chartContainer.style.height = '100%';
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

            const opts: uPlot.Options = {
                width: cw,
                height: ch,
                padding: [10, 20, null, 20],
                legend: {
                    show: showLegend,
                },
                axes: [
                    {
                        stroke: textColor,
                        grid: { stroke: gridColor, width: 1 }
                    },
                    {
                        stroke: textColor,
                        grid: { stroke: gridColor, width: 1 }
                    }
                ],
                series: [
                    {},
                    {
                        label: title || "数值",
                        stroke: primaryColor,
                        fill: primaryColor + "20",
                        width: 2
                    }
                ]
            };

            chart = new uPlot(opts, chartData, chartContainer);
        };

        const scheduleInit = () => {
            requestAnimationFrame(() => {
                initChart();
            });
        };

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                if (chart) {
                    const cw = chartContainer.clientWidth || 300;
                    const ch = chartContainer.clientHeight || 200;
                    chart.setSize({ width: cw, height: ch });
                }
            });
            ro.observe(chartContainer);
        }

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
