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
        .addNumberInput('labelOffsetY', {
          label: { zh: '标签高度偏移', en: 'Label Offset Y' },
          min: -50,
          max: 50,
          step: 0.1,
          default: 0.3,
        })
        .addTextInput('labelValue_pv', {
          label: { zh: '光伏数值', en: 'PV Value' },
          default: '',
          placeholder: '{{ ds.<id>.data.<field> }}',
          binding: true,
        })
        .addTextInput('labelValue_storage', {
          label: { zh: '储能数值', en: 'Storage Value' },
          default: '',
          placeholder: '{{ ds.<id>.data.<field> }}',
          binding: true,
        })
        .addTextInput('labelValue_substation', {
          label: { zh: '变配电数值', en: 'Substation Value' },
          default: '',
          placeholder: '{{ ds.<id>.data.<field> }}',
          binding: true,
        })
        .addTextInput('labelValue_workshop', {
          label: { zh: '车间数值', en: 'Workshop Value' },
          default: '',
          placeholder: '{{ ds.<id>.data.<field> }}',
          binding: true,
        })
        .addTextInput('labelValue_pump', {
          label: { zh: '水泵数值', en: 'Pump Value' },
          default: '',
          placeholder: '{{ ds.<id>.data.<field> }}',
          binding: true,
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
  .build();
