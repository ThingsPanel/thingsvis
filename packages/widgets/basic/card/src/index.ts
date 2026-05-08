import { defineWidget, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  if (!normalized || normalized === 'transparent') return 'transparent';
  const clamped = clamp(alpha, 0, 1);
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? '';
    const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
    const int = Number.parseInt(full, 16);
    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${clamped})`;
  }
  return normalized;
}

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

function renderCard(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const root = element.firstElementChild as HTMLDivElement | null;
  if (!root) return;
  const title = root.querySelector<HTMLDivElement>('[data-card-title]');
  const subtitle = root.querySelector<HTMLDivElement>('[data-card-subtitle]');
  const body = root.querySelector<HTMLDivElement>('[data-card-body]');

  root.style.width = '100%';
  root.style.height = '100%';
  root.style.boxSizing = 'border-box';
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.justifyContent = 'space-between';
  root.style.padding = `${props.paddingSize}px`;
  root.style.borderRadius = `${props.cornerRadius}px`;
  root.style.border = `${props.borderWidth}px solid ${props.borderColor}`;
  root.style.background = withAlpha(resolveColor(props.fillColor, colors.bg || '#ffffff'), props.fillOpacity);
  root.style.boxShadow = props.shadowEnabled
    ? `0 ${props.shadowOffsetY}px ${props.shadowBlur}px ${props.shadowColor}`
    : 'none';
  root.style.overflow = 'hidden';

  if (title) {
    title.textContent = props.title;
    title.style.fontSize = `${props.titleFontSize}px`;
    title.style.fontWeight = '700';
    title.style.lineHeight = '1.2';
    title.style.color = resolveColor(props.titleColor, colors.fg || '#0f172a');
  }

  if (subtitle) {
    subtitle.textContent = props.subtitle;
    subtitle.style.display = props.showSubtitle ? 'block' : 'none';
    subtitle.style.marginTop = '6px';
    subtitle.style.fontSize = '12px';
    subtitle.style.lineHeight = '1.4';
    subtitle.style.color = resolveColor(props.subtitleColor, 'rgba(100, 116, 139, 0.9)');
  }

  if (body) {
    body.textContent = props.body;
    body.style.marginTop = '14px';
    body.style.fontSize = '13px';
    body.style.lineHeight = '1.6';
    body.style.color = resolveColor(props.bodyColor, colors.fg || '#334155');
    body.style.whiteSpace = 'pre-wrap';
    body.style.wordBreak = 'break-word';
    body.style.flex = '1 1 auto';
  }
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    let colors = resolveWidgetColors(element);

    const root = document.createElement('div');
    const heading = document.createElement('div');
    const title = document.createElement('div');
    const subtitle = document.createElement('div');
    const body = document.createElement('div');
    title.dataset.cardTitle = 'true';
    subtitle.dataset.cardSubtitle = 'true';
    body.dataset.cardBody = 'true';
    heading.append(title, subtitle);
    root.append(heading, body);
    element.appendChild(root);

    const rerender = () => renderCard(element, currentProps, colors);
    rerender();

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        rerender();
      });
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        rerender();
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
