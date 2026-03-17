import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import './lib/video-rtc.js'; // Registers <video-rtc> element

import zh from './locales/zh.json';
import en from './locales/en.json';

const localeCatalog = { en, zh } as const;
type RuntimeMessages = {
  runtime: {
    empty: string;
    loading: string;
    error: string;
  };
};

function getRuntimeMessages(locale: string | undefined): RuntimeMessages {
  const normalized = locale?.toLowerCase();
  return normalized?.startsWith('zh') ? (localeCatalog.zh as RuntimeMessages) : (localeCatalog.en as RuntimeMessages);
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentLocale = ctx.locale;
    let status: 'empty' | 'loading' | 'error' | 'ready' = 'empty';
    let currentSrc = '';
    let internalVideo: HTMLVideoElement | null = null;
    let attachVideoListenersRaf = 0;
    let readyPollInterval: ReturnType<typeof setInterval> | null = null;

    const stopReadyPoll = () => {
      if (readyPollInterval) {
        clearInterval(readyPollInterval);
        readyPollInterval = null;
      }
    };

    const startReadyPoll = () => {
      stopReadyPoll();
      readyPollInterval = setInterval(() => {
        if (status === 'ready') { stopReadyPoll(); return; }
        if (internalVideo && (internalVideo.readyState >= 2 || internalVideo.currentTime > 0)) {
          updatePlaceholder('ready'); stopReadyPoll(); return;
        }
        // video-rtc exposes videoWidth/videoHeight on itself when stream is active
        if ((videoEl as HTMLVideoElement).videoWidth > 0) {
          updatePlaceholder('ready'); stopReadyPoll();
        }
      }, 300);
    };

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
    videoEl.style.zIndex = '1'; // stay above placeholder
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
    placeholder.style.zIndex = '0'; // always behind videoEl
    placeholder.style.boxSizing = 'border-box';
    placeholder.style.padding = '16px';
    placeholder.style.textAlign = 'center';
    placeholder.style.fontSize = '13px';
    const placeholderText = document.createElement('div');
    placeholder.appendChild(placeholderText);
    container.appendChild(placeholder);

    const updatePlaceholder = (nextStatus: 'empty' | 'loading' | 'error' | 'ready') => {
      const runtimeMessages = getRuntimeMessages(currentLocale).runtime;
      status = nextStatus;
      if (nextStatus === 'ready') {
        placeholder.style.display = 'none';
        return;
      }

      placeholder.style.display = 'flex';
      if (nextStatus === 'loading') {
        placeholderText.textContent = runtimeMessages.loading;
        return;
      }

      placeholderText.textContent = nextStatus === 'error'
        ? runtimeMessages.error
        : runtimeMessages.empty;
    };

    const normalizeSource = (input: unknown): string => {
      const trimmed = typeof input === 'string' ? input.trim() : '';
      if (!trimmed) return '';
      try {
        return new URL(trimmed, window.location.href).href;
      } catch {
        return trimmed;
      }
    };

    const markReadyIfPlayable = () => {
      if (!currentSrc || !internalVideo) return;
      if (internalVideo.readyState >= 2 || !internalVideo.paused || internalVideo.currentTime > 0) {
        updatePlaceholder('ready');
      }
    };

    const bindInternalVideo = () => {
      const maybeVideo = (videoEl as any).video as HTMLVideoElement | undefined;
      if (!maybeVideo) {
        attachVideoListenersRaf = requestAnimationFrame(bindInternalVideo);
        return;
      }

      if (internalVideo === maybeVideo) {
        return;
      }

      internalVideo = maybeVideo;
      markReadyIfPlayable();
      videoEl.addEventListener('loadeddata', markReadyIfPlayable);
      videoEl.addEventListener('canplay', markReadyIfPlayable);
      videoEl.addEventListener('playing', markReadyIfPlayable);
      internalVideo.addEventListener('loadeddata', () => updatePlaceholder('ready'));
      internalVideo.addEventListener('canplay', () => updatePlaceholder('ready'));
      internalVideo.addEventListener('playing', () => updatePlaceholder('ready'));
      internalVideo.addEventListener('error', () => updatePlaceholder('error'));
      internalVideo.addEventListener('stalled', () => {
        if (status !== 'ready') updatePlaceholder('error');
      });
      internalVideo.addEventListener('waiting', () => {
        if (status !== 'ready') updatePlaceholder('loading');
      });
    };

    bindInternalVideo();

    const updateView = () => {
      const { src, mode, background, visibilityThreshold, objectFit, borderWidth, borderColor, borderRadius } = currentProps;
      const normalizedSrc = normalizeSource(src);

      // Update placeholder vs video visibility
      if (!normalizedSrc) {
        currentSrc = '';
        updatePlaceholder('empty');
        videoEl.style.display = 'none';
        videoEl.removeAttribute('src'); // clear if empty
      } else {
        videoEl.style.display = 'block';
        const sourceChanged = currentSrc !== normalizedSrc;
        if (sourceChanged) {
          currentSrc = normalizedSrc;
          updatePlaceholder('loading');
          if (videoEl.src !== normalizedSrc) {
            videoEl.src = normalizedSrc;
          }
          startReadyPoll(); // fallback for streams that don't fire standard events
        } else {
          markReadyIfPlayable();
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
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentLocale = newCtx.locale;
        updateView();
      },
      destroy: () => {
        if (attachVideoListenersRaf) {
          cancelAnimationFrame(attachVideoListenersRaf);
        }
        stopReadyPoll();
        element.innerHTML = '';
      },
    };
  }
});

export default Main;
