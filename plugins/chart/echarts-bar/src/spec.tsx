import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * Visual Spec: chart/echarts-bar
 * - 使用真实 ECharts 实例在独立 DOM 中渲染，验证：
 *   1. 远程插件加载是否正常
 *   2. 引入 echarts 是否会产生全局样式/脚本污染
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    chart.setOption({
      title: {
        text: 'ECharts Bar',
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
    });

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        height: 260,
        border: '1px solid #333',
        borderRadius: 8,
        overflow: 'hidden'
      }}
    />
  );
};


