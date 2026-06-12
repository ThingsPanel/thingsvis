import { createControlPanel } from '@thingsvis/widget-sdk';
import { TemplateSchema } from './schema';

const W = 'widgets.thingsvis-widget-media-ezuikit-player';

const templateOptions = TemplateSchema.options.map((value) => ({
  label: `${W}.options.template.${value}`,
  value,
}));

export const controls = createControlPanel()
  .addGroup(
    'Auth',
    (builder) => {
      builder.addTextInput('accessToken', {
        label: `${W}.controls.accessToken`,
        placeholder: 'at.xxx',
        binding: true,
      });
    },
    { label: `${W}.groups.auth` },
  )
  .addGroup(
    'Source',
    (builder) => {
      builder
        .addTextInput('ezopenUrl', {
          label: `${W}.controls.ezopenUrl`,
          placeholder: 'ezopen://open.ys7.com/serial/1.live',
          binding: true,
        })
        .addTextInput('deviceSerial', {
          label: `${W}.controls.deviceSerial`,
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
        .addTextInput('validCode', {
          label: `${W}.controls.validCode`,
          binding: true,
        })
        .addSelect('streamSuffix', {
          label: `${W}.controls.streamSuffix`,
          options: [
            { label: `${W}.options.streamSuffix.live`, value: 'live' },
            { label: `${W}.options.streamSuffix.rec`, value: 'rec' },
          ],
          default: 'live',
          binding: true,
        })
        .addTextInput('playbackBegin', {
          label: `${W}.controls.playbackBegin`,
          placeholder: 'YYYYMMDDHHmmss',
          binding: true,
        })
        .addTextInput('playbackEnd', {
          label: `${W}.controls.playbackEnd`,
          placeholder: 'YYYYMMDDHHmmss',
          binding: true,
        });
    },
    { label: `${W}.groups.source` },
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
        .addTextInput('themeId', { label: `${W}.controls.themeId`, binding: true })
        .addSwitch('autoplay', { label: `${W}.controls.autoplay` })
        .addSwitch('audio', { label: `${W}.controls.audio` })
        .addTextInput('domain', {
          label: `${W}.controls.domain`,
          default: 'https://open.ys7.com',
        });
    },
    { label: `${W}.groups.player` },
  )
  .addGroup(
    'Style',
    (builder) => {
      builder
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
        .addTextInput('borderColor', { label: `${W}.controls.borderColor` });
    },
    { label: `${W}.groups.style` },
  )
  .build();
