import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder
      .addTextInput('modelUrl', {
        label: '模型地址',
        placeholder: 'https://example.com/model.glb',
        binding: true,
      })
      .addSelect('requestMode', {
        label: '加载方式',
        default: 'auto',
        options: [
          { label: '自动', value: 'auto' },
          { label: '直连', value: 'direct' },
          { label: '代理', value: 'proxy' },
        ],
      });
  })
  .addGroup(
    'Display',
    (builder) => {
      builder
        .addColorPicker('canvasBackgroundColor', {
          label: '画布背景',
          default: 'transparent',
        })
        .addSlider('modelScale', {
          label: '模型缩放',
          min: 0.01,
          max: 20,
          step: 0.01,
          default: 1,
        })
        .addSwitch('autoFitCamera', {
          label: '自动拟合镜头',
          default: true,
        })
        .addSwitch('enableInteraction', {
          label: '允许交互',
          default: true,
        })
        .addSwitch('playAnimations', {
          label: '播放动画',
          default: true,
        });
    },
    { label: { zh: '显示', en: 'Display' } },
  )
  .build();
