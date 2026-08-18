import { createControlPanel } from '@thingsvis/widget-sdk';

const W = 'widgets.thingsvis-widget-media-iframe';

export const controls = createControlPanel()
  .addGroup('Content', (builder) => {
    builder
      .addTextInput('src', { label: `${W}.src`, placeholder: 'https://...', binding: true })
      .addTextInput('title', { label: `${W}.title`, binding: true })
      .addSwitch('showHeader', { label: `${W}.showHeader`, default: false })
      .addSwitch('showRefresh', { label: `${W}.showRefresh`, default: true, showWhen: { field: 'showHeader', value: true } })
      .addSwitch('showOpenExternal', { label: `${W}.showOpenExternal`, default: true, showWhen: { field: 'showHeader', value: true } })
      .addSwitch('showFullscreen', { label: `${W}.showFullscreen`, default: true, showWhen: { field: 'showHeader', value: true } });
  }, { label: `${W}.groupContent` })
  .addGroup('Loading', (builder) => {
    builder.addNumberInput('loadTimeout', { label: `${W}.loadTimeout`, min: 3, max: 60, step: 1, default: 10 });
  }, { label: `${W}.groupLoading` })
  .addGroup('Security', (builder) => {
    builder
      .addSwitch('sandboxEnabled', { label: `${W}.sandboxEnabled`, default: true })
      .addSwitch('allowFullscreen', { label: `${W}.allowFullscreen`, default: true })
      .addSwitch('allowPopups', { label: `${W}.allowPopups`, default: false })
      .addSwitch('allowDownloads', { label: `${W}.allowDownloads`, default: false });
  }, { label: `${W}.groupSecurity`, expanded: false })
  .addGroup('Style', (builder) => {
    builder.addNumberInput('borderRadius', { label: `${W}.borderRadius`, min: 0, max: 100, step: 1, default: 0 });
  }, { label: `${W}.groupStyle` })
  .build();
