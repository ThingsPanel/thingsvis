import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import './lib/video-rtc.js'; // Registers <video-rtc> element

import zh from './locales/zh.json';
import en from './locales/en.json';

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;

    element.style.width = '100%';
    element.style.height = '100%';
    element.style.pointerEvents = 'auto';

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    element.appendChild(container);

    const videoEl: any = document.createElement('video-rtc');
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.display = 'block';
    videoEl.style.position = 'absolute';
    videoEl.style.top = '0';
    videoEl.style.left = '0';
    container.appendChild(videoEl);


    const updateView = () => {
      const { src, mode, background, visibilityThreshold, objectFit, borderWidth, borderColor, borderRadius } = currentProps;

      // Ensure video is visible
      videoEl.style.display = 'block';

      // Ensure we only set src if there is one and it changed
      if (src && src.trim() !== '') {
        const rawSrc = src.trim();
        if (videoEl.getAttribute('src') !== rawSrc) {
          videoEl.setAttribute('src', rawSrc);
        }
      } else {
        videoEl.removeAttribute('src'); // clear if empty
      }
      videoEl.mode = mode;
      videoEl.background = background;
      videoEl.visibilityThreshold = visibilityThreshold;

      // Update styles
      videoEl.style.objectFit = objectFit;
      container.style.border = `${borderWidth}px solid ${borderColor}`;
      container.style.borderRadius = `${borderRadius}px`;
      container.style.boxSizing = 'border-box';
    };

    updateView();

    return {
      update: (newProps: Props) => {
        currentProps = newProps;
        updateView();
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  }
});

export default Main;
