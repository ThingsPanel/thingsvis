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
        .addNumberInput('rotationX', {
          label: 'Rotation X',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationY', {
          label: 'Rotation Y',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationZ', {
          label: 'Rotation Z',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
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
  .addGroup(
    'Camera',
    (builder) => {
      builder
        .addSlider('cameraDistanceMultiplier', {
          label: 'Camera Distance',
          min: 0.02,
          max: 20,
          step: 0.01,
          default: 1,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraAzimuth', {
          label: 'Azimuth',
          min: -180,
          max: 180,
          step: 1,
          default: 35,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraElevation', {
          label: 'Elevation',
          min: -85,
          max: 85,
          step: 1,
          default: 22,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addSlider('cameraFov', {
          label: 'Field of View',
          min: 10,
          max: 120,
          step: 1,
          default: 45,
        })
        .addNumberInput('cameraTargetY', {
          label: 'Target Height',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        });
    },
    { label: { zh: 'Camera', en: 'Camera' } },
  )
  .build();
