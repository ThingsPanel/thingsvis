import { defineWidget, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';

import zh from './locales/zh.json';
import en from './locales/en.json';

const TRANSPARENT_VALUES = new Set(['', 'transparent', 'none']);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  if (TRANSPARENT_VALUES.has(normalized.toLowerCase())) {
    return 'transparent';
  }

  const clamped = clamp(alpha, 0, 1);
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? '';
    const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = (rgbMatch[1] ?? '').split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamped})`;
    }
  }

  return normalized;
}

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

function renderContainer(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const shell = element.firstElementChild as HTMLDivElement | null;
  if (!shell) return;

  const body = shell.querySelector<HTMLDivElement>('[data-container-body]');
  const fill = withAlpha(resolveColor(props.fillColor, colors.bg || '#ffffff'), props.containerOpacity);

  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';
  element.style.overflow = 'visible';

  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  shell.style.overflow = 'hidden';
  shell.style.background = fill;
  shell.style.border = `${props.containerBorderWidth}px solid ${props.containerBorderColor}`;
  shell.style.borderRadius = `${props.cornerRadius}px`;
  shell.style.boxShadow = props.shadowEnabled
    ? `0 ${props.shadowOffsetY}px ${props.shadowBlur}px ${props.shadowColor}`
    : 'none';

  if (body) {
    body.style.flex = '1 1 auto';
    body.style.minHeight = '0';
    body.style.boxSizing = 'border-box';
    body.style.padding = `${props.contentPadding}px`;
    body.style.pointerEvents = 'none';
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

    const shell = document.createElement('div');
    const body = document.createElement('div');

    body.dataset.containerBody = 'true';
    shell.append(body);
    element.appendChild(shell);

    renderContainer(element, currentProps, colors);

    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderContainer(element, currentProps, colors);
      });
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
    }

    return {
      update: (newProps: Props) => {
        currentProps = newProps;
        colors = resolveWidgetColors(element);
        renderContainer(element, currentProps, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
