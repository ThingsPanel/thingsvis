import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { renderDivider } from './variants/divider';
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
  };
}

function getRenderContext(props: Props) {
  return {
    primaryColor: props.primaryColor,
    secondaryColor: props.secondaryColor,
    animated: props.animated,
    animationSpeed: props.animationSpeed,
  };
}

function renderDividerWidget(element: HTMLElement, props: Props): void {
  // 不再使用 props.width/height，让 SVG 填满容器
  const ctx = getRenderContext(props);

  const svgContent = renderDivider(props.variant, props, ctx);
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
    renderDividerWidget(element, resolved);

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        currentColors = resolveWidgetColors(element);
        const resolved = resolveRenderProps(currentProps, currentColors);
        renderDividerWidget(element, resolved);
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
        renderDividerWidget(element, resolved);
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
