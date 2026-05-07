import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

const toneMap = {
  default: { bg: 'rgba(100,116,139,0.16)', text: '#475569', border: 'rgba(100,116,139,0.28)' },
  success: { bg: 'rgba(34,197,94,0.16)', text: '#15803d', border: 'rgba(34,197,94,0.28)' },
  warning: { bg: 'rgba(245,158,11,0.16)', text: '#b45309', border: 'rgba(245,158,11,0.28)' },
  danger: { bg: 'rgba(239,68,68,0.16)', text: '#b91c1c', border: 'rgba(239,68,68,0.28)' },
  info: { bg: 'rgba(59,130,246,0.16)', text: '#1d4ed8', border: 'rgba(59,130,246,0.28)' },
} as const;

function resolveRadius(shape: Props['shape']): string {
  if (shape === 'square') return '6px';
  if (shape === 'rounded') return '10px';
  return '999px';
}

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

function renderBadge(element: HTMLElement, props: Props): void {
  const shell = element.firstElementChild as HTMLDivElement | null;
  if (!shell) return;
  const tone = toneMap[props.tone];
  shell.textContent = props.text;
  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'inline-flex';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.padding = `0 ${props.paddingX}px`;
  shell.style.borderRadius = resolveRadius(props.shape);
  shell.style.border = `${props.borderWidth}px solid ${resolveColor(props.borderColor, tone.border)}`;
  shell.style.background = resolveColor(props.backgroundColor, tone.bg);
  shell.style.color = resolveColor(props.textColor, tone.text);
  shell.style.fontSize = `${props.fontSize}px`;
  shell.style.fontWeight = props.fontWeight;
  shell.style.opacity = String(props.opacity);
  shell.style.whiteSpace = 'nowrap';
  shell.style.overflow = 'hidden';
  shell.style.textOverflow = 'ellipsis';
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    element.appendChild(shell);
    renderBadge(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderBadge(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
