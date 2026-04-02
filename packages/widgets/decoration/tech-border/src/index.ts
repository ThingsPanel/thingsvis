import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function resolveRenderProps(
  props: Props,
  colors: ReturnType<typeof resolveWidgetColors>,
): Props {
  if (!props.useThemeColor) {
    return props;
  }

  const themePrimary = resolveLayeredColor({
    instance: null,
    theme: colors.primary,
    fallback: '#6965db',
  });

  return {
    ...props,
    borderColor: themePrimary,
    glowColor: themePrimary,
    gradientStart: themePrimary,
    gradientEnd: themePrimary,
  };
}

function generateCornerCutBorder(props: Props, uuid: string): string {
  const w = 100;
  const h = 100;
  const c = props.cornerSize;
  const bw = props.borderWidth;

  const borderPath = `M ${c},0 L ${w - c},0 L ${w},${c} L ${w},${h - c} L ${w - c},${h} L ${c},${h} L 0,${h - c} L 0,${c} Z`;

  const decorationPaths = props.showCornerDecoration
    ? `
    <path d="M 0,${props.decorationLength} L 0,${c} L ${c},0 L ${props.decorationLength},0"
      fill="none" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}" stroke-linecap="round"/>
    <path d="M ${w - props.decorationLength},0 L ${w - c},0 L ${w},${c} L ${w},${props.decorationLength}"
      fill="none" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}" stroke-linecap="round"/>
    <path d="M ${w},${h - props.decorationLength} L ${w},${h - c} L ${w - c},${h} L ${w - props.decorationLength},${h}"
      fill="none" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}" stroke-linecap="round"/>
    <path d="M ${props.decorationLength},${h} L ${c},${h} L 0,${h - c} L 0,${h - props.decorationLength}"
      fill="none" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}" stroke-linecap="round"/>
  `
    : '';

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"
      style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <defs>
        <linearGradient id="grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${props.gradientAngle}, 50, 50)">
          <stop offset="0%" stop-color="${props.gradientEnabled ? props.gradientStart : props.borderColor}"/>
          <stop offset="100%" stop-color="${props.gradientEnabled ? props.gradientEnd : props.borderColor}"/>
        </linearGradient>
        ${
          props.glowEnabled
            ? `
          <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="${props.glowBlur / 10}" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        `
            : ''
        }
      </defs>

      ${
        props.glowEnabled
          ? `
        <path d="${borderPath}" fill="none" stroke="${props.glowColor || props.borderColor}"
          stroke-width="${bw + props.glowSpread}" opacity="0.3" filter="url(#glow-${uuid})"/>
      `
          : ''
      }

      <path d="${borderPath}" fill="none" stroke="url(#grad-${uuid})" stroke-width="${bw}"
        ${
          props.animated
            ? `
          stroke-dasharray="20,10"
          stroke-dashoffset="0"
          style="animation: flow-${uuid} ${props.animationSpeed}s linear infinite;"
        `
            : ''
        }
      />

      ${decorationPaths}
    </svg>
  `;
}

function generateTechLinesBorder(props: Props, uuid: string): string {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <defs>
        <linearGradient id="grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${props.gradientEnabled ? props.gradientStart : props.borderColor}"/>
          <stop offset="100%" stop-color="${props.gradientEnabled ? props.gradientEnd : props.borderColor}"/>
        </linearGradient>
        ${
          props.glowEnabled
            ? `
          <filter id="glow-${uuid}">
            <feGaussianBlur stdDeviation="${props.glowBlur / 10}"/>
          </filter>
        `
            : ''
        }
      </defs>

      <rect x="2" y="2" width="96" height="96" fill="none" stroke="url(#grad-${uuid})"
        stroke-width="${props.borderWidth}" rx="4"/>

      <line x1="10" y1="0" x2="10" y2="15" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="0" y1="10" x2="15" y2="10" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="90" y1="0" x2="90" y2="15" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="100" y1="10" x2="85" y2="10" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="10" y1="100" x2="10" y2="85" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="0" y1="90" x2="15" y2="90" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="90" y1="100" x2="90" y2="85" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
      <line x1="100" y1="90" x2="85" y2="90" stroke="url(#grad-${uuid})" stroke-width="${props.decorationWidth}"/>
    </svg>
  `;
}

function generateGlowBorder(props: Props, uuid: string): string {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <defs>
        <linearGradient id="grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${props.gradientEnabled ? props.gradientStart : props.borderColor}"/>
          <stop offset="100%" stop-color="${props.gradientEnabled ? props.gradientEnd : props.borderColor}"/>
        </linearGradient>
        <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${props.glowBlur / 5}" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect x="5" y="5" width="90" height="90" fill="none" stroke="${props.glowColor || props.borderColor}"
        stroke-width="${props.borderWidth + 4}" opacity="0.2" filter="url(#glow-${uuid})" rx="8"/>

      <rect x="5" y="5" width="90" height="90" fill="none" stroke="${props.glowColor || props.borderColor}"
        stroke-width="${props.borderWidth + 2}" opacity="0.4" filter="url(#glow-${uuid})" rx="8"/>

      <rect x="5" y="5" width="90" height="90" fill="none" stroke="url(#grad-${uuid})"
        stroke-width="${props.borderWidth}" rx="8"/>
    </svg>
  `;
}

function generateSimpleBorder(props: Props, uuid: string): string {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <defs>
        <linearGradient id="grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${props.gradientEnabled ? props.gradientStart : props.borderColor}"/>
          <stop offset="100%" stop-color="${props.gradientEnabled ? props.gradientEnd : props.borderColor}"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="url(#grad-${uuid})"
        stroke-width="${props.borderWidth}" rx="${props.cornerSize / 2}"/>
    </svg>
  `;
}

function renderBorder(
  element: HTMLElement,
  props: Props,
  colors: ReturnType<typeof resolveWidgetColors>,
) {
  const uuid = generateId();
  const resolvedProps = resolveRenderProps(props, colors);

  let svgContent = '';
  switch (resolvedProps.variant) {
    case 'tech-lines':
      svgContent = generateTechLinesBorder(resolvedProps, uuid);
      break;
    case 'glow':
      svgContent = generateGlowBorder(resolvedProps, uuid);
      break;
    case 'simple':
      svgContent = generateSimpleBorder(resolvedProps, uuid);
      break;
    case 'corner-cut':
    default:
      svgContent = generateCornerCutBorder(resolvedProps, uuid);
      break;
  }

  const animStyle = resolvedProps.animated
    ? `
    <style>
      @keyframes flow-${uuid} {
        to { stroke-dashoffset: -30; }
      }
    </style>
  `
    : '';

  element.innerHTML = `
    ${animStyle}
    <div style="
      width: 100%;
      height: 100%;
      position: relative;
      box-sizing: border-box;
    ">
      ${svgContent}
      <div style="
        position: absolute;
        top: ${resolvedProps.contentPadding}px;
        left: ${resolvedProps.contentPadding}px;
        right: ${resolvedProps.contentPadding}px;
        bottom: ${resolvedProps.contentPadding}px;
        background: ${resolvedProps.backgroundColor};
        overflow: hidden;
        border-radius: ${Math.max(0, resolvedProps.cornerSize - resolvedProps.contentPadding / 2)}px;
      " class="tech-border-content">
      </div>
    </div>
  `;

  return element.querySelector('.tech-border-content') as HTMLElement;
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
    element.style.width = '100%';
    element.style.height = '100%';
    element.dataset.thingsvisOverlay = metadata.id;

    let currentProps = props;
    let currentColors = resolveWidgetColors(element);
    let contentContainer: HTMLElement | null = renderBorder(element, currentProps, currentColors);

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        currentColors = resolveWidgetColors(element);
        contentContainer = renderBorder(element, currentProps, currentColors);
      });
      themeObserver.observe(themeTarget, {
        attributes: true,
        attributeFilter: ['data-canvas-theme'],
      });
    }

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentColors = resolveWidgetColors(element);
        contentContainer = renderBorder(element, currentProps, currentColors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
      getContentContainer: () => contentContainer,
    };
  },
});

export default Main;
