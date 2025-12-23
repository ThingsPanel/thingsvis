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

    // 延迟初始化 ECharts，等待元素有实际尺寸
    let chart: echarts.ECharts | null = null;
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

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (!chart) {
            // 首次初始化：容器已有尺寸
            chart = echarts.init(el);
            chart.setOption(baseOption);
          } else {
            // 尺寸变化时 resize
            chart.resize();
          }
        }
      }
    });
    resizeObserver.observe(el);

    return {
      element: el,
      update: next => {
        if (!chart) return;
        const nextTitle = (next.props?.title as string) ?? baseOption.title.text;
        chart.setOption({
          ...baseOption,
          title: { ...(baseOption as any).title, text: nextTitle }
        });
        chart.resize();
      },
      destroy: () => {
        resizeObserver.disconnect();
        chart?.dispose();
        chart = null;
      }
    };
  }
};

export default Main;


