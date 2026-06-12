import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-media-camera-control';

export const controls = createControlPanel()
  .addGroup(
    'Source',
    (builder) => {
      builder
        .addSelect('mode', {
          label: `${W}.controls.mode`,
          options: [
            { label: `${W}.options.mode.live`, value: 'live' },
            { label: `${W}.options.mode.playback`, value: 'playback' },
          ],
          default: 'live',
          binding: true,
        })
        .addTextInput('streamUrl', {
          label: `${W}.controls.streamUrl`,
          placeholder: 'webrtc://, ws://, http://...',
          binding: true,
        })
        .addTextInput('playbackUrl', {
          label: `${W}.controls.playbackUrl`,
          placeholder: 'Playback stream URL',
          binding: true,
        })
        .addSelect('streamMode', {
          label: `${W}.controls.streamMode`,
          options: [
            { label: 'Auto', value: 'webrtc,mse,hls,mjpeg' },
            { label: 'WebRTC', value: 'webrtc' },
            { label: 'MSE', value: 'mse' },
            { label: 'HLS', value: 'hls' },
            { label: 'HTTP-FLV', value: 'flv' },
            { label: 'MJPEG', value: 'mjpeg' },
          ],
          default: 'webrtc,mse,hls,mjpeg',
        })
        .addSwitch('autoplay', { label: `${W}.controls.autoplay` });
    },
    { label: `${W}.groups.source` },
  )
  .addGroup(
    'Control',
    (builder) => {
      builder
        .addSwitch('showStatusBar', { label: `${W}.controls.showStatusBar` })
        .addTextInput('onlineStatus', { label: `${W}.controls.onlineStatus`, binding: true })
        .addTextInput('recordingStatus', { label: `${W}.controls.recordingStatus`, binding: true })
        .addSwitch('showSnapshot', { label: `${W}.controls.showSnapshot` })
        .addSwitch('showFullscreen', { label: `${W}.controls.showFullscreen` })
        .addSwitch('showPlaybackControls', { label: `${W}.controls.showPlaybackControls` })
        .addTextInput('playbackStart', { label: `${W}.controls.playbackStart`, binding: true })
        .addTextInput('playbackEnd', { label: `${W}.controls.playbackEnd`, binding: true });
    },
    { label: `${W}.groups.control` },
  )
  .addGroup(
    'Advanced Control',
    (builder) => {
      builder
        .addSwitch('showZoomControls', { label: `${W}.controls.showZoomControls` })
        .addSwitch('showFocusControls', { label: `${W}.controls.showFocusControls` })
        .addSwitch('showPresetControl', { label: `${W}.controls.showPresetControl` })
        .addNumberInput('ptzSpeed', {
          label: `${W}.controls.ptzSpeed`,
          min: 1,
          max: 10,
          step: 1,
          default: 3,
        })
        .addTextInput('presetId', { label: `${W}.controls.presetId`, binding: true });
    },
    { label: `${W}.groups.advancedControl` },
  )
  .addGroup(
    'Commands',
    (builder) => {
      builder
        .addTextInput('ptzMoveCommand', { label: `${W}.controls.ptzMoveCommand`, binding: true })
        .addTextInput('ptzStopCommand', { label: `${W}.controls.ptzStopCommand`, binding: true })
        .addTextInput('ptzZoomCommand', { label: `${W}.controls.ptzZoomCommand`, binding: true })
        .addTextInput('ptzFocusCommand', { label: `${W}.controls.ptzFocusCommand`, binding: true })
        .addTextInput('presetGotoCommand', {
          label: `${W}.controls.presetGotoCommand`,
          binding: true,
        })
        .addTextInput('snapshotCommand', { label: `${W}.controls.snapshotCommand`, binding: true })
        .addTextInput('playbackOpenCommand', {
          label: `${W}.controls.playbackOpenCommand`,
          binding: true,
        });
    },
    { label: `${W}.groups.commands` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
        .addSelect('objectFit', {
          label: `${W}.controls.objectFit`,
          options: [
            { label: `${W}.options.objectFit.contain`, value: 'contain' },
            { label: `${W}.options.objectFit.cover`, value: 'cover' },
            { label: `${W}.options.objectFit.fill`, value: 'fill' },
            { label: `${W}.options.objectFit.none`, value: 'none' },
          ],
          default: 'contain',
        })
        .addNumberInput('borderRadius', {
          label: `${W}.controls.borderRadius`,
          min: 0,
          max: 48,
          step: 1,
          default: 6,
        })
        .addNumberInput('borderWidth', {
          label: `${W}.controls.borderWidth`,
          min: 0,
          max: 12,
          step: 1,
          default: 0,
        })
        .addTextInput('borderColor', { label: `${W}.controls.borderColor` })
        .addNumberInput('panelOpacity', {
          label: `${W}.controls.panelOpacity`,
          min: 0,
          max: 1,
          step: 0.05,
          default: 0.78,
        });
    },
    { label: `${W}.groups.style` },
  )
  .build();
