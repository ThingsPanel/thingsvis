import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { metadata } from './metadata';
import { PropsSchema, THINGSVIS_SANS_STACK, type Props } from './schema';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

const DEFAULT_TEXT_FILL = '#333333';
const LEGACY_SANS_FONT_FAMILIES = new Set([
  'sans-serif',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Microsoft YaHei',
  'PingFang SC',
  'SimHei',
  'SimSun',
  'SF Pro Display',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
]);

type RuntimeMessages = {
  runtime?: {
    previewText?: string;
  };
};

function getRuntimeMessages(locale?: string): RuntimeMessages {
  return locale?.toLowerCase().startsWith('zh') ? (zh as RuntimeMessages) : (en as RuntimeMessages);
}

function resolveDisplayText(props: Props, ctx: WidgetOverlayContext) {
  const rawText = typeof props.text === 'string' ? props.text : String(props.text ?? '');
  if (rawText.trim()) {
    return { text: rawText, isPlaceholder: false };
  }

  return {
    text: getRuntimeMessages(ctx.locale).runtime?.previewText ?? 'Enter text',
    isPlaceholder: true,
  };
}

function resolveTextColor(props: Props, colors: WidgetColors, isPlaceholder: boolean) {
  if (isPlaceholder) {
    return colors.fg;
  }
  return resolveLayeredColor({
    instance: props.fill,
    theme: colors.fg,
    fallback: colors.fg,
    inheritValues: [DEFAULT_TEXT_FILL],
  });
}

function applyStyles(
  element: HTMLDivElement,
  props: Props,
  ctx: WidgetOverlayContext,
  colors: WidgetColors,
) {
  const content = resolveDisplayText(props, ctx);
  element.textContent = content.text;
  element.dataset.thingsvisPlaceholder = content.isPlaceholder ? 'true' : 'false';

  element.style.fontSize = `${props.fontSize}px`;
  element.style.fontFamily = normalizeFontFamily(props.fontFamily);
  element.style.fontWeight = props.fontWeight;
  element.style.fontStyle = props.fontStyle;
  element.style.textAlign = props.textAlign;
  element.style.lineHeight = String(props.lineHeight);
  element.style.letterSpacing = props.letterSpacing ? `${props.letterSpacing}px` : 'normal';
  element.style.textDecoration = props.textDecoration;
  element.style.color = resolveTextColor(props, colors, content.isPlaceholder);
  element.style.opacity = content.isPlaceholder ? '0.68' : String(props.opacity);

  if (props.textShadowEnabled) {
    element.style.textShadow = `${props.textShadowOffsetX}px ${props.textShadowOffsetY}px ${props.textShadowBlur}px ${props.textShadowColor}`;
  } else {
    element.style.textShadow = 'none';
  }

  element.style.wordBreak = 'break-word';
  element.style.whiteSpace = 'pre-wrap';
}

function normalizeFontFamily(fontFamily: string): string {
  const normalized = fontFamily.trim();
  if (!normalized) {
    return THINGSVIS_SANS_STACK;
  }

  if (normalized.includes('Noto Sans') || normalized === 'Inter' || normalized === 'serif' || normalized === 'monospace') {
    return normalized;
  }

  if (LEGACY_SANS_FONT_FAMILIES.has(normalized)) {
    return THINGSVIS_SANS_STACK;
  }

  return normalized;
}

function getFlexAlign(align: Props['textAlign']): string {
  switch (align) {
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    case 'justify':
      return 'space-between';
    default:
      return 'flex-start';
  }
}

function getVerticalAlign(align: Props['verticalAlign']): string {
  switch (align) {
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
    default:
      return 'flex-start';
  }
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    element.style.display = 'inline-flex';
    element.style.width = 'fit-content';
    element.style.height = 'fit-content';
    element.style.overflow = 'visible';
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.style.boxSizing = 'border-box';
    element.dataset.thingsvisOverlay = 'basic-text';

    let currentCtx = ctx;
    let currentProps = props;
    let colors = resolveWidgetColors(element);

    const textEl = document.createElement('div');
    textEl.style.width = 'fit-content';
    textEl.style.height = 'fit-content';
    textEl.style.boxSizing = 'border-box';
    textEl.dataset.thingsvisMeasure = '1';
    element.appendChild(textEl);

    const renderText = () => {
      colors = resolveWidgetColors(element);
      applyStyles(textEl, currentProps, currentCtx, colors);
      element.style.justifyContent = getFlexAlign(currentProps.textAlign);
      element.style.alignItems = getVerticalAlign(currentProps.verticalAlign);
    };

    renderText();

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => renderText());
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
    }

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentCtx = nextCtx;
        renderText();
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
