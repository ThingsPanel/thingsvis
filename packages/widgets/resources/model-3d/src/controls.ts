import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  .addContentGroup((builder) => {
    builder
      .addTextInput('modelUrl', {
        label: { zh: '模型地址', en: 'Model URL' },
        placeholder: 'https://example.com/model.glb',
        binding: true,
      })
      .addSelect('requestMode', {
        label: { zh: '加载方式', en: 'Request Mode' },
        default: 'auto',
        options: [
          { label: { zh: '自动', en: 'Auto' }, value: 'auto' },
          { label: { zh: '直连', en: 'Direct' }, value: 'direct' },
          { label: { zh: '代理', en: 'Proxy' }, value: 'proxy' },
        ],
      });
  })
  .addGroup(
    'Display',
    (builder) => {
      builder
        .addColorPicker('canvasBackgroundColor', {
          label: { zh: '画布背景', en: 'Canvas Background' },
          default: 'transparent',
        })
        .addSlider('modelScale', {
          label: { zh: '模型缩放', en: 'Model Scale' },
          min: 0.01,
          max: 20,
          step: 0.01,
          default: 1,
        })
        .addNumberInput('rotationX', {
          label: { zh: '旋转 X', en: 'Rotation X' },
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationY', {
          label: { zh: '旋转 Y', en: 'Rotation Y' },
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationZ', {
          label: { zh: '旋转 Z', en: 'Rotation Z' },
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addSwitch('autoFitCamera', {
          label: { zh: '自动拟合镜头', en: 'Auto-fit Camera' },
          default: true,
        })
        .addSwitch('enableInteraction', {
          label: { zh: '允许交互', en: 'Enable Interaction' },
          default: true,
        })
        .addSwitch('playAnimations', {
          label: { zh: '播放动画', en: 'Play Animations' },
          default: true,
        });
    },
    { label: { zh: '显示', en: 'Display' } },
  )
  .addGroup(
    'Camera',
    (builder) => {
      builder
        .addSlider('cameraDistanceMultiplier', {
          label: { zh: '镜头距离', en: 'Camera Distance' },
          min: 0.02,
          max: 20,
          step: 0.01,
          default: 1,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraAzimuth', {
          label: { zh: '方位角', en: 'Azimuth' },
          min: -180,
          max: 180,
          step: 1,
          default: 35,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraElevation', {
          label: { zh: '仰角', en: 'Elevation' },
          min: -85,
          max: 85,
          step: 1,
          default: 22,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addSlider('cameraFov', {
          label: { zh: '视野角', en: 'Field of View' },
          min: 10,
          max: 120,
          step: 1,
          default: 45,
        })
        .addNumberInput('cameraTargetY', {
          label: { zh: '目标高度', en: 'Target Height' },
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        });
    },
    { label: { zh: '镜头', en: 'Camera' } },
  )
  .build();
