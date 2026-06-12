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

function renderRichText(element: HTMLElement, props: Props): void {
  const colors = resolveWidgetColors(element);
  const shell = element.firstElementChild as HTMLDivElement | null;
  const body = shell?.querySelector<HTMLDivElement>('[data-rich-body]');
  if (!shell || !body) return;

  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  shell.style.gap = '10px';
  shell.style.padding = `${props.paddingSize}px`;
  shell.style.borderRadius = `${props.cornerRadius}px`;
  shell.style.border = `${props.borderWidth}px solid ${props.borderColor}`;
  shell.style.background = withAlpha(props.backgroundColor, props.backgroundOpacity);
  shell.style.textAlign = props.align;

  body.textContent = props.body;
  body.style.flex = '1 1 auto';
  body.style.whiteSpace = 'pre-wrap';
  body.style.wordBreak = 'break-word';
  body.style.fontSize = `${props.bodyFontSize}px`;
  body.style.lineHeight = String(props.lineHeight);
  body.style.color = resolveColor(props.bodyColor, colors.fg || '#334155');
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    const body = document.createElement('div');
    body.dataset.richBody = 'true';
    shell.append(body);
    element.appendChild(shell);
    renderRichText(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderRichText(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
