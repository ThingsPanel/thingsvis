import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import * as echarts from 'echarts';
import geoJson from './assets/china.json';

import zh from './locales/zh.json';
import en from './locales/en.json';

// Register map data
echarts.registerMap('china', geoJson as any);

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,

  render: (el: HTMLElement, props: Props, ctx) => {
    const box = document.createElement('div');
    box.style.width = '100%';
    box.style.height = '100%';
    el.appendChild(box);

    const chart = echarts.init(box, null, { renderer: 'canvas' });

    const getOption = (currentProps: Props, currentTheme: 'light' | 'dark' | string) => {
      // Default theme handling
      const isDark = currentTheme === 'dark';
      const defaultAreaColor = currentProps.areaColor || (isDark ? '#323c48' : '#eee');
      const defaultBorderColor = currentProps.borderColor || (isDark ? '#111' : '#ccc');
      const defaultEmphasisColor = currentProps.emphasisAreaColor || (isDark ? '#2a333d' : '#ddd');
      const defaultLabelColor = currentProps.labelColor || (isDark ? '#fff' : '#000');

      return {
        backgroundColor: 'transparent',
        visualMap: {
          show: false,
          min: currentProps.visualMapMin,
          max: currentProps.visualMapMax,
          inRange: {
            color: [currentProps.inRangeColorStart, currentProps.inRangeColorEnd]
          },
          calculable: true,
        },
        series: [
          {
            type: 'map',
            map: 'china',
            label: {
              show: currentProps.showLabel,
              color: defaultLabelColor,
            },
            itemStyle: {
              areaColor: defaultAreaColor,
              borderColor: defaultBorderColor,
              borderWidth: currentProps.borderWidth,
            },
            emphasis: {
              itemStyle: {
                areaColor: defaultEmphasisColor,
              },
              label: {
                show: currentProps.showLabel,
                color: defaultLabelColor,
              },
            },
            data: [
              // Mock data mapping to provinces
              { name: '北京', value: 100 },
              { name: '广东', value: 50 },
              { name: '上海', value: 80 },
              { name: '浙江', value: 60 },
              { name: '江苏', value: 70 },
            ],
          },
        ]
      };
    };

    // Initial render
    // Use optional chaining for ctx?.theme if it's available, otherwise fallback
    const initialTheme = (ctx as any)?.theme || 'dark';
    chart.setOption(getOption(props, initialTheme));

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(box);

    return {
      update: (newProps: Props, newCtx) => {
        const theme = (newCtx as any)?.theme || 'dark';
        chart.setOption(getOption(newProps, theme));
      },
      destroy: () => {
        resizeObserver.disconnect();
        chart.dispose();
      },
    };
  },
});
