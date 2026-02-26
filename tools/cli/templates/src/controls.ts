/**
 * 属性面板控制配置
 * 
 * 使用 @thingsvis/widget-sdk 的 createControlPanel Builder API
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  // ============================================
  // 样式分组
  // ============================================
  .addGroup('Style', (builder) => {
    builder
      .addColor('fill', {
        label: 'widgets.{{PACKAGE_NAME}}.fillColor',
        binding: true,
      })
      .addSlider('opacity', {
        label: 'widgets.{{PACKAGE_NAME}}.opacity',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1,
        binding: true,
      });
  }, { label: 'widgets.{{PACKAGE_NAME}}.style' })

  .build();
