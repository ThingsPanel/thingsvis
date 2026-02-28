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

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.backgroundColor = 'transparent';
    element.appendChild(container);

    const videoEl: any = document.createElement('video-rtc');
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.display = 'block';
    videoEl.style.position = 'absolute';
    videoEl.style.top = '0';
    videoEl.style.left = '0';
    container.appendChild(videoEl);

    const styleEl = document.createElement('style');
    container.appendChild(styleEl);

    // Placeholder
    const placeholder = document.createElement('div');
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.backgroundColor = 'rgba(150, 150, 150, 0.1)';
    placeholder.style.border = '1px dashed rgba(150, 150, 150, 0.5)';
    placeholder.style.color = 'rgba(150, 150, 150, 0.5)';
    placeholder.style.position = 'absolute';
    placeholder.style.top = '0';
    placeholder.style.left = '0';
    placeholder.style.boxSizing = 'border-box';
    placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>';
    container.appendChild(placeholder);

    const updateView = () => {
      const { src, mode, background, visibilityThreshold, objectFit, borderWidth, borderColor, borderRadius } = currentProps;

      // Update placeholder vs video visibility
      if (!src || src.trim() === '') {
        placeholder.style.display = 'flex';
        videoEl.style.display = 'none';
        videoEl.removeAttribute('src'); // clear if empty
      } else {
        placeholder.style.display = 'none';
        videoEl.style.display = 'block';
        const rawSrc = src.trim();
        if (videoEl.src !== rawSrc) {
          videoEl.src = rawSrc;
        }
      }
      videoEl.mode = mode;
      videoEl.background = background;
      videoEl.visibilityThreshold = visibilityThreshold;

      // Update styles
      videoEl.style.objectFit = objectFit;
      styleEl.innerHTML = `video-rtc video { object-fit: ${objectFit} !important; }`;
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
