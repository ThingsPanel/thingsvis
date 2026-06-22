import { createControlPanel } from '@thingsvis/widget-sdk';
import { TemplateSchema } from './schema';

const W = 'widgets.thingsvis-widget-media-ezuikit-player';

const templateOptions = TemplateSchema.options.map((value) => ({
  label: `${W}.options.template.${value}`,
  value,
}));

export const controls = createControlPanel()
  .addGroup(
    'Connection',
    (builder) => {
      builder
        .addTextInput('accessToken', {
          label: `${W}.controls.accessToken`,
          placeholder: 'at.xxx',
          binding: true,
        })
        .addTextInput('deviceSerial', {
          label: `${W}.controls.deviceSerial`,
          placeholder: 'J33497314',
          binding: true,
        })
        .addNumberInput('channelNo', {
          label: `${W}.controls.channelNo`,
          min: 1,
          max: 32,
          step: 1,
          default: 1,
          binding: true,
        })
        .addSwitch('hd', { label: `${W}.controls.hd`, default: true })
        .addTextInput('validCode', {
          label: `${W}.controls.validCode`,
          binding: true,
        });
    },
    { label: `${W}.groups.connection` },
  )
  .addGroup(
    'Playback',
    (builder) => {
      builder
        .addTextInput('spaceId', {
          label: `${W}.controls.spaceId`,
          placeholder: '361254',
          default: '361254',
        })
        .addTextInput('busType', {
          label: `${W}.controls.busType`,
          default: '7',
        });
    },
    { label: `${W}.groups.playback` },
  )
  .addGroup(
    'Player',
    (builder) => {
      builder
        .addSelect('template', {
          label: `${W}.controls.template`,
          options: templateOptions,
          default: 'security',
        })
        .addSwitch('autoplay', { label: `${W}.controls.autoplay` })
        .addSwitch('audio', { label: `${W}.controls.audio` });
    },
    { label: `${W}.groups.player` },
  )
  .addGroup(
    'Advanced',
    (builder) => {
      builder.addTextInput('domain', {
        label: `${W}.controls.domain`,
        default: 'https://open.ys7.com',
      });
    },
    { label: `${W}.groups.advanced` },
  )
  .addGroup(
    'Border',
    (builder) => {
      builder
        .addNumberInput('borderWidth', {
          label: `${W}.controls.borderWidth`,
          min: 0,
          max: 12,
          step: 1,
          default: 0,
        })
        .addTextInput('borderColor', { label: `${W}.controls.borderColor` });
    },
    { label: `${W}.groups.border` },
  )
  .build();
