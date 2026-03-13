/**
 * Widget entry point — built with @thingsvis/widget-sdk defineWidget API
 */

import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';

import zh from './locales/zh.json';
import en from './locales/en.json';

export const Main = defineWidget({
  ...metadata,

  schema: PropsSchema,
  locales: { zh, en },
  controls,

  render: (el: HTMLElement, props: Props) => {
    const box = document.createElement('div');
    box.style.width = '100%';
    box.style.height = '100%';
    box.style.backgroundColor = props.fill;
    box.style.opacity = String(props.opacity);
    el.appendChild(box);

    return {
      update: (newProps: Props) => {
        box.style.backgroundColor = newProps.fill;
        box.style.opacity = String(newProps.opacity);
      },
      destroy: () => {
        el.innerHTML = '';
      },
    };
  },
});

export default Main;
