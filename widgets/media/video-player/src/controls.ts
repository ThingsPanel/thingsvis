/**
 * 属性面板控制配置
 * 
 * 使用 @thingsvis/widget-sdk 的 createControlPanel Builder API
 */

import { createControlPanel } from '@thingsvis/widget-sdk';

export const controls = createControlPanel()
  .addGroup('Source', (builder) => {
    builder
      .addTextInput('src', {
        label: 'widgets.thingsvis-widget-media-video-player.src',
        placeholder: 'ws://... or http://...',
        binding: true,
      })
      .addSelect('mode', {
        label: 'widgets.thingsvis-widget-media-video-player.mode',
        options: [
          { label: 'Auto (webrtc,mse,hls,mjpeg)', value: 'webrtc,mse,hls,mjpeg' },
          { label: 'WebRTC', value: 'webrtc' },
          { label: 'MSE', value: 'mse' },
          { label: 'HLS', value: 'hls' },
          { label: 'MJPEG', value: 'mjpeg' },
        ],
        default: 'webrtc,mse,hls,mjpeg'
      })
      .addSwitch('background', {
        label: 'widgets.thingsvis-widget-media-video-player.background',
      });
  }, { label: 'widgets.thingsvis-widget-media-video-player.source' })
  .addGroup('Style', (builder) => {
    builder
      .addSelect('objectFit', {
        label: 'widgets.thingsvis-widget-media-video-player.objectFit',
        options: [
          { label: 'Contain', value: 'contain' },
          { label: 'Cover', value: 'cover' },
          { label: 'Fill', value: 'fill' },
          { label: 'None', value: 'none' },
        ],
        default: 'contain'
      })
      .addNumberInput('borderWidth', {
        label: 'widgets.thingsvis-widget-media-video-player.borderWidth',
        min: 0,
        step: 1,
        default: 0
      })
      .addColorPicker('borderColor', {
        label: 'widgets.thingsvis-widget-media-video-player.borderColor',
        binding: true
      })
      .addNumberInput('borderRadius', {
        label: 'widgets.thingsvis-widget-media-video-player.borderRadius',
        min: 0,
        step: 1,
        default: 0
      });
  }, { label: 'widgets.thingsvis-widget-media-video-player.style' })

  .build();
