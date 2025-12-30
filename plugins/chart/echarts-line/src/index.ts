/**
 * ECharts 折线图主入口 (Overlay 模板)
 * 
 * 📝 开发指南：
 * - Overlay 组件使用 createOverlay 而非 create
 * - 返回 { element, update, destroy } 对象
 * - element: DOM 容器元素
 * - update: 属性变化时调用
 * - destroy: 组件销毁时调用
 * 
 * 💡 提示：
 * - ECharts 实例在 update 中根据新 props 更新
 * - 必须在 destroy 中调用 chart.dispose() 释放资源
 */

import * as echarts from 'echarts';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props, type DataPoint } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 根据 Props 生成 ECharts Option
 */
function buildOption(props: Props): echarts.EChartsOption {
  const { title, data, lineColor, showArea, smooth, showSymbol, showLegend } = props;
  
  return {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      show: showLegend,
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: showLegend ? '15%' : '3%',
      top: title ? '15%' : '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d: DataPoint) => d.name),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        type: 'line',
        data: data.map((d: DataPoint) => d.value),
        smooth,
        showSymbol,
        lineStyle: { color: lineColor },
        itemStyle: { color: lineColor },
        areaStyle: showArea ? { color: lineColor, opacity: 0.2 } : undefined,
      },
    ],
  };
}

/**
 * 创建 ECharts Overlay 实例
 */
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  // 创建容器元素
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.pointerEvents = 'auto';
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  
  // 应用背景色
  element.style.backgroundColor = currentProps.backgroundColor;
  
  // 初始化 ECharts
  const chart = echarts.init(element);
  chart.setOption(buildOption(currentProps));
  
  return {
    element,
    
    /**
     * 属性更新时调用
     */
    update: (newCtx: PluginOverlayContext) => {
      // 合并新属性
      currentProps = { ...currentProps, ...(newCtx.props as Partial<Props>) };
      
      // 更新背景色
      element.style.backgroundColor = currentProps.backgroundColor;
      
      // 更新图表尺寸
      if (newCtx.size) {
        chart.resize();
      }
      
      // 更新图表配置
      chart.setOption(buildOption(currentProps));
    },
    
    /**
     * 组件销毁时调用
     */
    destroy: () => {
      chart.dispose();
    },
  };
}

/**
 * 插件主模块
 */
export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  createOverlay,
};

export default Main;
