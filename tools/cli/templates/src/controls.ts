/**
 * 属性面板控制配置
 * 
 * 使用 @thingsvis/plugin-sdk 的 createControlPanel Builder API
 */

import { createControlPanel } from '@thingsvis/plugin-sdk';

export const controls = createControlPanel()
  // ============================================
  // 样式分组
  // ============================================
  .addGroup('Style', (builder) => {
    builder
      .addColor('fill', {
        label: '填充颜色',
        binding: true,
      })
      .addSlider('opacity', {
        label: '不透明度',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1,
        binding: true,
      });
  }, { label: '样式' })

  .build();
