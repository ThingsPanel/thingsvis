import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { renderSectionTitle } from './variants/section-title';
import { renderMainHeader } from './variants/main-header';
import zh from './locales/zh.json';
import en from './locales/en.json';

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
    fallback: '#00c2ff',
  });

  return {
    ...props,
    primaryColor: themePrimary,
    secondaryColor: themePrimary,
    glowColor: themePrimary,
  };
}

/** 哪些变体支持文字渲染 */
const TITLE_VARIANTS = new Set([
  'bar', 'chevron', 'slash', 'trapezoid',
  'circuit-line', 'glow-beam', 'arc-dip', 'zigzag-flow',
  'diamond-bar', 'sleek', 'diamond-crown', 'circuit',
  'aurora', 'wing-arrow', 'bold-shield', 'bracket-frame', 'nav-tab', 'cyber-matrix',
]);

function getRenderContext(props: Props) {
  const raw = props.title ?? '';
  const hasText = raw.trim().length > 0;
  /** 仅当变体支持文字且用户输入非空时绘制标题（与属性面板输入框一致，空则画布无字） */
  const showTitle = TITLE_VARIANTS.has(props.variant) && hasText;
  return {
    primaryColor: props.primaryColor,
    secondaryColor: props.secondaryColor,
    glowColor: props.glowColor,
    title: raw,
    animated: props.animated,
    animationSpeed: props.animationSpeed,
    showDecoration: props.showDecoration,
    showTitle,
  };
}

function renderTitle(
  element: HTMLElement,
  props: Props,
): void {
  const ctx = getRenderContext(props);

  // 根据变体分类分发到对应的渲染器
  const sectionVariants = ['bar','chevron','slash','trapezoid','glow-beam',
    'arc-dip','circuit-line','zigzag-flow','sparkle-dots',
    'triple-segment','corner-mark','center-fade'];
  const mainVariants = ['diamond-bar','sleek','diamond-crown','circuit',
    'aurora','wing-arrow','bold-shield','bracket-frame','nav-tab','cyber-matrix'];

  let svgContent: string;
  if (sectionVariants.includes(props.variant)) {
    svgContent = renderSectionTitle(props.variant, props, ctx);
  } else if (mainVariants.includes(props.variant)) {
    svgContent = renderMainHeader(props.variant, props, ctx);
  } else {
    // fallback
    svgContent = renderSectionTitle(props.variant, props, ctx);
  }

  element.innerHTML = svgContent;
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

    const resolved = resolveRenderProps(currentProps, currentColors);
    renderTitle(element, resolved);

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        currentColors = resolveWidgetColors(element);
        const resolved = resolveRenderProps(currentProps, currentColors);
        renderTitle(element, resolved);
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
        const resolved = resolveRenderProps(currentProps, currentColors);
        renderTitle(element, resolved);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
      getContentContainer: () => null,
    };
  },
});

export default Main;
