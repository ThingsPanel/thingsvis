import {
  defineWidget,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import * as echarts from 'echarts';
import geoJson from './assets/china.json';

import zh from './locales/zh.json';
import en from './locales/en.json';

// Register map data once
echarts.registerMap('china', geoJson as any);

function buildOption(props: Props, colors: WidgetColors): echarts.EChartsOption {
  const areaColor = props.areaColor || colors.series[0];
  // For emphasis, blend the area color slightly toward white/black;
  // since we can't easily tint programmatically, use the second series color as fallback
  const emphasisColor = props.emphasisAreaColor || colors.series[1];
  const regionBorderColor = props.regionBorderColor || props.borderColor || colors.border;
  const regionBorderWidth = props.regionBorderWidth ?? props.borderWidth ?? 1;
  const labelColor = props.labelColor || colors.fg;

  return {
    backgroundColor: 'transparent',
    visualMap: {
      show: false,
      min: props.visualMapMin,
      max: props.visualMapMax,
      inRange: {
        color: [props.inRangeColorStart, props.inRangeColorEnd],
      },
      calculable: true,
    },
    series: [
      {
        type: 'map',
        map: 'china',
        label: {
          show: props.showLabel,
          color: labelColor,
        },
        itemStyle: {
          areaColor,
          borderColor: regionBorderColor,
          borderWidth: regionBorderWidth,
        },
        emphasis: {
          itemStyle: {
            areaColor: emphasisColor,
          },
          label: {
            show: props.showLabel,
            color: labelColor,
          },
        },
        data: [],
      },
    ],
  };
}

function applyHostSize(host: HTMLElement, ctx: WidgetOverlayContext) {
  const widthSource = ctx.size?.width ?? host.clientWidth ?? 320;
  const heightSource = ctx.size?.height ?? host.clientHeight ?? 240;
  const width = Math.max(1, Math.round(Number(widthSource || 320)));
  const height = Math.max(1, Math.round(Number(heightSource || 240)));

  host.style.width = `${width}px`;
  host.style.height = `${height}px`;

  Object.defineProperties(host, {
    clientWidth: {
      configurable: true,
      get: () => width,
    },
    clientHeight: {
      configurable: true,
      get: () => height,
    },
  });

  host.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
}

function renderMap(element: HTMLElement, props: Props, ctx: WidgetOverlayContext) {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'flex';

  const chartHost = document.createElement('div');
  chartHost.style.width = '100%';
  chartHost.style.height = '100%';
  applyHostSize(chartHost, ctx);
  element.appendChild(chartHost);

  let currentProps = props;
  let colors: WidgetColors = resolveWidgetColors(element);
  let currentCtx = ctx;

  const chart = echarts.init(chartHost, null, { renderer: 'canvas' });

  const scheduleRender = () => {
    requestAnimationFrame(() => {
      if (!chart.isDisposed()) {
        applyHostSize(chartHost, currentCtx);
        colors = resolveWidgetColors(element);
        chart.setOption(buildOption(currentProps, colors), true);
        chart.resize();
      }
    });
  };

  scheduleRender();

  // Track size changes
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => scheduleRender());
    ro.observe(element);
  }

  // Track canvas theme changes (the same pattern as echarts-line)
  let themeObserver: MutationObserver | null = null;
  const themeTarget = element.closest('[data-canvas-theme]');
  if (themeTarget && typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => scheduleRender());
    themeObserver.observe(themeTarget, {
      attributes: true,
      attributeFilter: ['data-canvas-theme'],
    });
  }

    return {
    update: (newProps: Props, newCtx: WidgetOverlayContext) => {
      currentProps = newProps;
      currentCtx = newCtx;
      scheduleRender();
    },
    destroy: () => {
      ro?.disconnect();
      themeObserver?.disconnect();
      chart.dispose();
    },
  };
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: renderMap,
});
