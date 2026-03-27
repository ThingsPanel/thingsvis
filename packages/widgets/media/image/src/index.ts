import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, resolveLocaleRecord, type WidgetOverlayContext } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

const localeCatalog = { en, zh } as const;
type PlaceholderState = 'empty' | 'loading' | 'error' | 'ready';
type PlaceholderMessageKey = Exclude<PlaceholderState, 'ready'>;

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

function normalizeImageSource(source: string): string {
  const trimmed = source.trim();
  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('//') ||
    ABSOLUTE_URL_RE.test(trimmed)
  ) {
    return trimmed;
  }

  const base = (() => {
    if (typeof window === 'undefined') return undefined;

    const isEmbedded = typeof window.parent !== 'undefined' && window.parent !== window;
    if (isEmbedded && typeof document !== 'undefined' && document.referrer) {
      try {
        return new URL(document.referrer).origin;
      } catch {
        // Fall back to the current page URL below.
      }
    }

    return window.location.href;
  })();

  if (!base) return trimmed;

  try {
    return new URL(trimmed, base).toString();
  } catch {
    return trimmed;
  }
}

function resolveLocalePack(locale: string | undefined) {
  return resolveLocaleRecord(localeCatalog, locale, 'zh');
}

function getPlaceholderMessage(locale: string | undefined, key: PlaceholderMessageKey): string {
  return resolveLocalePack(locale).editor.widgets['thingsvis-widget-media-image'][key];
}

function applyStyles(img: HTMLImageElement, container: HTMLElement, props: Props) {
  img.style.opacity = String(props.opacity);
  img.style.objectFit = props.objectFit;
  img.style.objectPosition = 'center';
  img.style.borderRadius = `${props.cornerRadius}px`;
  img.style.borderColor = props.borderColor;
  img.style.borderWidth = `${props.borderWidth}px`;
  img.style.borderStyle = props.borderWidth > 0 ? 'solid' : 'none';

  container.style.borderRadius = `${props.cornerRadius}px`;
  container.style.overflow = 'hidden';
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
    let currentSrc = '';
    let loadRequestId = 0;
    let lastDataUrl = props.dataUrl;
    let placeholderState: PlaceholderState = 'empty';

    element.style.width = '100%';
    element.style.height = '100%';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.style.boxSizing = 'border-box';
    element.style.position = 'relative';
    element.style.background = 'transparent';
    element.dataset.thingsvisOverlay = 'media-image';

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.boxSizing = 'border-box';
    img.style.visibility = 'hidden';
    img.draggable = false;
    element.appendChild(img);

    const placeholder = document.createElement('div');
    placeholder.style.position = 'absolute';
    placeholder.style.inset = '0';
    placeholder.style.display = 'flex';
    placeholder.style.flexDirection = 'column';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.gap = '8px';
    placeholder.style.padding = '16px';
    placeholder.style.boxSizing = 'border-box';
    placeholder.style.border = '1px dashed rgba(127, 127, 127, 0.35)';
    placeholder.style.background = 'rgba(127, 127, 127, 0.06)';
    placeholder.style.color = 'rgba(127, 127, 127, 0.9)';
    placeholder.style.fontSize = '13px';
    placeholder.style.textAlign = 'center';
    placeholder.style.pointerEvents = 'none';
    element.appendChild(placeholder);

    const placeholderText = document.createElement('div');
    placeholder.appendChild(placeholderText);

    const updatePlaceholder = (state: PlaceholderState) => {
      placeholderState = state;

      if (state === 'ready') {
        placeholder.style.display = 'none';
        return;
      }

      placeholder.style.display = 'flex';
      placeholderText.textContent = getPlaceholderMessage(currentLocale, state);
    };

    const clearDisplayedImage = () => {
      currentSrc = '';
      img.removeAttribute('src');
      img.style.visibility = 'hidden';
    };

    const beginImageLoad = (source: string) => {
      const normalizedSource = normalizeImageSource(source);
      currentSrc = normalizedSource;

      if (!normalizedSource) {
        loadRequestId += 1;
        clearDisplayedImage();
        updatePlaceholder('empty');
        return;
      }

      const requestId = ++loadRequestId;
      updatePlaceholder('loading');

      const probe = new Image();
      probe.onload = () => {
        if (requestId !== loadRequestId || currentSrc !== normalizedSource) {
          return;
        }

        img.src = normalizedSource;
        img.style.visibility = 'visible';
        updatePlaceholder('ready');
      };
      probe.onerror = () => {
        if (requestId !== loadRequestId || currentSrc !== normalizedSource) {
          return;
        }

        clearDisplayedImage();
        updatePlaceholder('error');
      };
      probe.src = normalizedSource;
    };

    applyStyles(img, element, currentProps);
    beginImageLoad(currentProps.dataUrl);

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentLocale = newCtx.locale;
        currentProps = newProps;
        applyStyles(img, element, currentProps);

        if (newProps.dataUrl !== lastDataUrl) {
          lastDataUrl = newProps.dataUrl;
          beginImageLoad(currentProps.dataUrl);
          return;
        }

        if (placeholderState !== 'ready') {
          updatePlaceholder(placeholderState);
        }
      },
      destroy: () => {
        loadRequestId += 1;
        clearDisplayedImage();
      },
    };
  },
});

export default Main;
