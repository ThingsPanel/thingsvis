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
      })
      .addColorPicker('canvasBackgroundColor', {
        label: '画布背景',
        default: 'transparent',
      });
  })
  .addGroup(
    'Model',
    (builder) => {
      builder
        .addSlider('modelScale', {
          label: '模型缩放',
          min: 0.01,
          max: 20,
          step: 0.01,
          default: 1,
        })
        .addNumberInput('positionX', {
          label: '位置 X',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('positionY', {
          label: '位置 Y',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('positionZ', {
          label: '位置 Z',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('rotationX', {
          label: '旋转 X',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationY', {
          label: '旋转 Y',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addNumberInput('rotationZ', {
          label: '旋转 Z',
          min: -180,
          max: 180,
          step: 1,
          default: 0,
        })
        .addSwitch('wireframe', {
          label: '线框模式',
          default: false,
        });
    },
    { label: { zh: '模型', en: 'Model' } },
  )
  .addGroup(
    'Camera',
    (builder) => {
      builder
        .addSwitch('autoFitCamera', {
          label: '自动拟合镜头',
          default: true,
        })
        .addSlider('cameraDistanceMultiplier', {
          label: '镜头距离',
          min: 0.02,
          max: 20,
          step: 0.01,
          default: 1,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraAzimuth', {
          label: '方位角',
          min: -180,
          max: 180,
          step: 1,
          default: 35,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addNumberInput('cameraElevation', {
          label: '俯仰角',
          min: -85,
          max: 85,
          step: 1,
          default: 22,
          showWhen: { field: 'autoFitCamera', value: true },
        })
        .addSlider('cameraFov', {
          label: '视场角',
          min: 10,
          max: 120,
          step: 1,
          default: 45,
        })
        .addNumberInput('cameraTargetX', {
          label: '目标 X',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('cameraTargetY', {
          label: '目标 Y',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('cameraTargetZ', {
          label: '目标 Z',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('cameraPositionX', {
          label: '相机 X',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 4,
          showWhen: { field: 'autoFitCamera', value: false },
        })
        .addNumberInput('cameraPositionY', {
          label: '相机 Y',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 2,
          showWhen: { field: 'autoFitCamera', value: false },
        })
        .addNumberInput('cameraPositionZ', {
          label: '相机 Z',
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 6,
          showWhen: { field: 'autoFitCamera', value: false },
        })
        .addNumberInput('cameraNear', {
          label: '近裁剪面',
          min: 0.001,
          max: 100,
          step: 0.001,
          default: 0.01,
          showWhen: { field: 'autoFitCamera', value: false },
        })
        .addNumberInput('cameraFar', {
          label: '远裁剪面',
          min: 1,
          max: 10000,
          step: 1,
          default: 1000,
          showWhen: { field: 'autoFitCamera', value: false },
        })
        .addNumberInput('minZoomDistance', {
          label: '最小缩放',
          min: 0.001,
          max: 1000,
          step: 0.01,
          default: 0.05,
        })
        .addNumberInput('maxZoomDistance', {
          label: '最大缩放',
          min: 0.1,
          max: 10000,
          step: 0.1,
          default: 100,
        });
    },
    { label: { zh: '镜头', en: 'Camera' } },
  )
  .addGroup(
    'Lighting',
    (builder) => {
      builder
        .addSlider('ambientLightIntensity', {
          label: '环境光',
          min: 0,
          max: 10,
          step: 0.1,
          default: 1.2,
        })
        .addSlider('directionalLightIntensity', {
          label: '主光强度',
          min: 0,
          max: 10,
          step: 0.1,
          default: 2.4,
        })
        .addSlider('fillLightIntensity', {
          label: '辅光强度',
          min: 0,
          max: 10,
          step: 0.1,
          default: 0.8,
        })
        .addSlider('exposure', {
          label: '曝光',
          min: 0.1,
          max: 5,
          step: 0.05,
          default: 1.05,
        });
    },
    { label: { zh: '灯光', en: 'Lighting' } },
  )
  .addGroup(
    'Interaction',
    (builder) => {
      builder
        .addSwitch('enableInteraction', {
          label: '允许拖拽查看',
          default: true,
        })
        .addSwitch('autoRotate', {
          label: '自动旋转',
          default: false,
        })
        .addSlider('rotationSpeed', {
          label: '旋转速度',
          min: 0.1,
          max: 10,
          step: 0.1,
          default: 1.2,
          showWhen: { field: 'autoRotate', value: true },
        });
    },
    { label: { zh: '交互', en: 'Interaction' } },
  )
  .addGroup(
    'Animation',
    (builder) => {
      builder
        .addSwitch('playAnimations', {
          label: '播放动画',
          default: true,
        })
        .addSlider('animationSpeed', {
          label: '动画速度',
          min: 0.1,
          max: 5,
          step: 0.1,
          default: 1,
          showWhen: { field: 'playAnimations', value: true },
        });
    },
    { label: { zh: '动画', en: 'Animation' }, expanded: false },
  )
  .addGroup(
    'Debug',
    (builder) => {
      builder
        .addSwitch('showAxes', {
          label: '显示坐标轴',
          default: false,
        })
        .addNumberInput('axesSize', {
          label: '坐标轴尺寸',
          min: 0.1,
          max: 1000,
          step: 0.1,
          default: 5,
          showWhen: { field: 'showAxes', value: true },
        })
        .addSwitch('showGrid', {
          label: '显示网格',
          default: false,
        })
        .addNumberInput('gridSize', {
          label: '网格尺寸',
          min: 1,
          max: 1000,
          step: 1,
          default: 20,
          showWhen: { field: 'showGrid', value: true },
        })
        .addNumberInput('gridDivisions', {
          label: '网格分段',
          min: 1,
          max: 200,
          step: 1,
          default: 20,
          showWhen: { field: 'showGrid', value: true },
        })
        .addSwitch('showBoundingBox', {
          label: '显示包围盒',
          default: false,
        });
    },
    { label: { zh: '调试', en: 'Debug' }, expanded: false },
  )
  .build();
