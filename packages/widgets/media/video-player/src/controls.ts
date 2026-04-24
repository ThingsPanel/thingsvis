import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-media-video-player';

export const controls = createControlPanel()
  .addGroup('Title', (builder) => {
    builder.addSwitch('showTitle', { label: '显示标题', binding: true });
    builder.addTextInput('title', { label: '组件标题', binding: true });
  }, { label: '标题' })
  .addGroup(
    'Source',
    (builder) => {
      builder
        .addTextInput('src', {
          label: `${W}.src`,
          placeholder: 'ws://... or http://...',
          binding: true,
        })
        .addSelect('mode', {
          label: `${W}.mode`,
          options: [
            { label: { en: 'Auto (webrtc,mse,hls,mjpeg)', zh: '自动 (webrtc,mse,hls,mjpeg)' }, value: 'webrtc,mse,hls,mjpeg' },
            { label: 'WebRTC', value: 'webrtc' },
            { label: 'MSE', value: 'mse' },
            { label: 'HLS', value: 'hls' },
            { label: 'MJPEG', value: 'mjpeg' },
          ],
          default: 'webrtc,mse,hls,mjpeg',
        })
        .addSwitch('background', {
          label: `${W}.background`,
        });
    },
    { label: `${W}.groupContent` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addSelect('objectFit', {
          label: `${W}.objectFit`,
          options: [
            { label: { en: 'Contain', zh: '包含' }, value: 'contain' },
            { label: { en: 'Cover', zh: '覆盖' }, value: 'cover' },
            { label: { en: 'Fill', zh: '填充' }, value: 'fill' },
            { label: { en: 'None', zh: '无' }, value: 'none' },
          ],
          default: 'contain',
        })
        .addNumberInput('borderRadius', {
          label: `${W}.borderRadius`,
          min: 0,
          step: 1,
          default: 0,
        });
    },
    { label: `${W}.groupStyle` },
  )
  .build();
