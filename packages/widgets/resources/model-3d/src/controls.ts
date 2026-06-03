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
    'Transform',
    (builder) => {
      builder
        .addSlider('modelScale', {
          label: { zh: '模型缩放', en: 'Model Scale' },
          min: 0.01,
          max: 20,
          step: 0.01,
          default: 1,
        })
        .addNumberInput('positionX', {
          label: { zh: '位置 X', en: 'Position X' },
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('positionY', {
          label: { zh: '位置 Y', en: 'Position Y' },
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        })
        .addNumberInput('positionZ', {
          label: { zh: '位置 Z', en: 'Position Z' },
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
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
        });
    },
    { label: { zh: '变换', en: 'Transform' } },
  )
  .addGroup(
    'Display',
    (builder) => {
      builder
        .addColorPicker('canvasBackgroundColor', {
          label: { zh: '画布背景', en: 'Canvas Background' },
          default: 'transparent',
        })
        .addSwitch('wireframe', {
          label: { zh: '线框模式', en: 'Wireframe' },
          default: false,
        })
        .addSwitch('enableInteraction', {
          label: { zh: '允许交互', en: 'Enable Interaction' },
          default: true,
        });
    },
    { label: { zh: '显示', en: 'Display' } },
  )
  .addGroup(
    'Camera',
    (builder) => {
      builder
        .addSwitch('autoFitCamera', {
          label: { zh: '自动拟合镜头', en: 'Auto-fit Camera' },
          default: true,
        })
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
        .addSwitch('limitCameraAngle', {
          label: { zh: '限制旋转角度', en: 'Limit Rotation' },
          default: true,
        })
        .addNumberInput('minCameraElevation', {
          label: { zh: '最小仰角', en: 'Min Elevation' },
          min: -85,
          max: 85,
          step: 1,
          default: 12,
          showWhen: { field: 'limitCameraAngle', value: true },
        })
        .addNumberInput('maxCameraElevation', {
          label: { zh: '最大仰角', en: 'Max Elevation' },
          min: -85,
          max: 85,
          step: 1,
          default: 34,
          showWhen: { field: 'limitCameraAngle', value: true },
        })
        .addNumberInput('minCameraAzimuth', {
          label: { zh: '最小方位角', en: 'Min Azimuth' },
          min: -180,
          max: 180,
          step: 1,
          default: 5,
          showWhen: { field: 'limitCameraAngle', value: true },
        })
        .addNumberInput('maxCameraAzimuth', {
          label: { zh: '最大方位角', en: 'Max Azimuth' },
          min: -180,
          max: 180,
          step: 1,
          default: 75,
          showWhen: { field: 'limitCameraAngle', value: true },
        })
        .addSlider('fitAnchorY', {
          label: { zh: '垂直锚点', en: 'Vertical Anchor' },
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.38,
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
          label: { zh: '目标高度偏移', en: 'Target Height Offset' },
          min: -1000,
          max: 1000,
          step: 0.1,
          default: 0,
        });
    },
    { label: { zh: '镜头', en: 'Camera' } },
  )
  .addGroup(
    'Lighting',
    (builder) => {
      builder
        .addSlider('ambientLightIntensity', {
          label: { zh: '环境光强度', en: 'Ambient Light' },
          min: 0,
          max: 10,
          step: 0.1,
          default: 1.2,
        })
        .addSlider('directionalLightIntensity', {
          label: { zh: '主光强度', en: 'Main Light' },
          min: 0,
          max: 10,
          step: 0.1,
          default: 2.4,
        })
        .addSlider('fillLightIntensity', {
          label: { zh: '补光强度', en: 'Fill Light' },
          min: 0,
          max: 10,
          step: 0.1,
          default: 0.8,
        })
        .addSlider('exposure', {
          label: { zh: '曝光', en: 'Exposure' },
          min: 0.1,
          max: 5,
          step: 0.05,
          default: 1.05,
        });
    },
    { label: { zh: '灯光', en: 'Lighting' } },
  )
  .addGroup(
    'Animation',
    (builder) => {
      builder
        .addSwitch('playAnimations', {
          label: { zh: '播放模型动画', en: 'Play Model Animations' },
          default: true,
        })
        .addSlider('animationSpeed', {
          label: { zh: '动画速度', en: 'Animation Speed' },
          min: 0.1,
          max: 5,
          step: 0.1,
          default: 1,
          showWhen: { field: 'playAnimations', value: true },
        })
        .addSwitch('autoRotate', {
          label: { zh: '自动旋转', en: 'Auto Rotate' },
          default: false,
        })
        .addSlider('rotationSpeed', {
          label: { zh: '旋转速度', en: 'Rotation Speed' },
          min: 0.1,
          max: 10,
          step: 0.1,
          default: 1.2,
          showWhen: { field: 'autoRotate', value: true },
        });
    },
    { label: { zh: '动画', en: 'Animation' } },
  )
  .addGroup(
    'Labels',
    (builder) => {
      builder
        .addSwitch('showSceneLabels', {
          label: { zh: '显示锚点标签', en: 'Show Anchor Labels' },
          default: true,
        })
        .addTextInput('labelAnchorPrefix', {
          label: { zh: '锚点前缀', en: 'Anchor Prefix' },
          default: 'anchor_',
        })
        .addCustom('sceneLabels', 'model3dLabels' as any, {
          label: { zh: '标签配置', en: 'Labels' },
          default: [],
        });
    },
    { label: { zh: '标签', en: 'Labels' } },
  )
  .addGroup(
    'PipeFlow',
    (builder) => {
      builder
        .addSwitch('showPipeFlow', {
          label: { zh: '管道流动', en: 'Pipe Flow' },
          default: true,
        })
        .addTextInput('pipeNamePrefix', {
          label: { zh: '管道名称前缀', en: 'Pipe Name Prefix' },
          default: '能量线_',
        })
        .addSlider('pipeFlowSpeed', {
          label: { zh: '流动速度', en: 'Flow Speed' },
          min: 0.1,
          max: 10,
          step: 0.1,
          default: 1.8,
          showWhen: { field: 'showPipeFlow', value: true },
        });
    },
    { label: { zh: '管道', en: 'Pipes' } },
  )
  .addGroup(
    'Debug',
    (builder) => {
      builder
        .addSwitch('showAxes', {
          label: { zh: '显示坐标轴', en: 'Show Axes' },
          default: false,
        })
        .addNumberInput('axesSize', {
          label: { zh: '坐标轴尺寸', en: 'Axes Size' },
          min: 0.1,
          max: 1000,
          step: 1,
          default: 5,
          showWhen: { field: 'showAxes', value: true },
        })
        .addSwitch('showGrid', {
          label: { zh: '显示网格', en: 'Show Grid' },
          default: false,
        })
        .addNumberInput('gridSize', {
          label: { zh: '网格尺寸', en: 'Grid Size' },
          min: 1,
          max: 1000,
          step: 1,
          default: 20,
          showWhen: { field: 'showGrid', value: true },
        })
        .addNumberInput('gridDivisions', {
          label: { zh: '网格分段', en: 'Grid Divisions' },
          min: 1,
          max: 200,
          step: 1,
          default: 20,
          showWhen: { field: 'showGrid', value: true },
        })
        .addSwitch('showBoundingBox', {
          label: { zh: '显示包围盒', en: 'Show Bounding Box' },
          default: false,
        });
    },
    { label: { zh: '调试', en: 'Debug' }, expanded: false },
  )
  .build();
