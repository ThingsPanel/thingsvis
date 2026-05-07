import { defineWidget, resolveWidgetColors } from '@thingsvis/widget-sdk';
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
  if (!hexMatch) return normalized;
  const raw = hexMatch[1] ?? '';
  const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
  const int = Number.parseInt(full, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${clamped})`;
}

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

function getIconMarkup(name: Props['iconName']): string {
  switch (name) {
    case 'circle':
      return '<circle cx="24" cy="24" r="14"></circle>';
    case 'triangle':
      return '<path d="M24 10 L37 35 H11 Z"></path>';
    case 'bolt':
      return '<path d="M27 6 14 27h8l-2 15 14-21h-8l1-15Z"></path>';
    case 'star':
      return '<path d="m24 8 4.9 9.9 10.9 1.6-7.9 7.7 1.9 10.8L24 33l-9.8 5.1 1.9-10.8-7.9-7.7 10.9-1.6Z"></path>';
    case 'heart':
      return '<path d="M24 39s-12-7.7-12-18.1c0-5.2 4-8.9 8.5-8.9 2.5 0 4.6 1.1 6 3 1.4-1.9 3.5-3 6-3 4.5 0 8.5 3.7 8.5 8.9C36 31.3 24 39 24 39Z"></path>';
    case 'pin':
      return '<path d="M24 40s9-9 9-18c0-5-4-9-9-9s-9 4-9 9c0 9 9 18 9 18Z"></path><circle cx="24" cy="22" r="3.5"></circle>';
    case 'bell':
      return '<path d="M16 33h16l-1.7-2.8c-1-1.6-1.5-3.4-1.5-5.3v-3.3c0-3.4-2.2-6.2-5.3-7.2V12a1.5 1.5 0 1 0-3 0v2.4c-3.1 1-5.3 3.8-5.3 7.2v3.3c0 1.9-.5 3.7-1.5 5.3Z"></path><path d="M20.5 36a3.5 3.5 0 0 0 7 0"></path>';
    case 'square':
    default:
      return '<rect x="11" y="11" width="26" height="26" rx="4"></rect>';
  }
}

function renderIcon(element: HTMLElement, props: Props): void {
  const colors = resolveWidgetColors(element);
  const shell = element.firstElementChild as HTMLDivElement | null;
  const svg = shell?.querySelector('svg');
  if (!shell || !svg) return;

  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.padding = `${props.paddingSize}px`;
  shell.style.opacity = String(props.opacity);
  shell.style.borderRadius = `${props.cornerRadius}px`;
  shell.style.background = withAlpha(props.backgroundColor, props.backgroundOpacity);
  shell.style.border = props.showFrame ? `${props.frameWidth}px solid ${props.frameColor}` : 'none';

  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', resolveColor(props.color, colors.fg || '#0f172a'));
  svg.setAttribute('stroke-width', String(props.strokeWidth));
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.innerHTML = getIconMarkup(props.iconName);
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    shell.appendChild(svg);
    element.appendChild(shell);
    renderIcon(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderIcon(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
