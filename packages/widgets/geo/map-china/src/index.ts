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
  const borderColor = props.borderColor || colors.border;
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
          borderColor,
          borderWidth: props.borderWidth,
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

function renderMap(element: HTMLElement, props: Props, _ctx: WidgetOverlayContext) {
  element.style.width = '100%';
  element.style.height = '100%';

  let currentProps = props;
  let colors: WidgetColors = resolveWidgetColors(element);

  const chart = echarts.init(element, null, { renderer: 'canvas' });

  const scheduleRender = () => {
    requestAnimationFrame(() => {
      if (!chart.isDisposed()) {
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
    update: (newProps: Props, _newCtx: WidgetOverlayContext) => {
      currentProps = newProps;
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
