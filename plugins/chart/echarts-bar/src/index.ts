import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from '@thingsvis/schema';
import { Rect } from 'leafer-ui';
import { Spec } from './spec';
import * as echarts from 'echarts';

export const componentId = 'chart/echarts-bar';

/**
 * Leafer 渲染侧：先用一个简单矩形作为占位，后续可以扩展为真正的 DOM overlay 容器。
 */
export function create() {
  return new Rect({
    width: 320,
    height: 200,
    fill: '#141414',
    stroke: '#1677ff',
    strokeWidth: 2
  });
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec,
  schema: {
    props: {
      title: {
        type: 'string',
        default: 'ECharts Bar Demo',
        description: '图表标题'
      }
    }
  },
  createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.background = '#141414';
    // pointer-events 允许交互
    el.style.pointerEvents = 'auto';

    const chart = echarts.init(el);
    const baseOption = {
      title: {
        text: (ctx.props?.title as string) ?? 'ECharts Bar Demo',
        left: 'center',
        textStyle: { color: '#fff', fontSize: 14 }
      },
      backgroundColor: '#141414',
      tooltip: {},
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisLine: { lineStyle: { color: '#aaa' } }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#aaa' } },
        splitLine: { lineStyle: { color: '#333' } }
      },
      series: [
        {
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110, 130],
          itemStyle: {
            color: '#1677ff'
          }
        }
      ]
    };
    chart.setOption(baseOption);

    return {
      element: el,
      update: next => {
        const nextTitle = (next.props?.title as string) ?? baseOption.title.text;
        chart.setOption({
          ...baseOption,
          title: { ...(baseOption as any).title, text: nextTitle }
        });
        chart.resize();
      },
      destroy: () => {
        chart.dispose();
      }
    };
  }
};

export default Main;


