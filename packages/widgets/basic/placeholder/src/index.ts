import { defineWidget } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

function getIcon(icon: Props['icon']): string {
  if (icon === 'image') {
    return '<rect x="10" y="12" width="28" height="24" rx="4"></rect><path d="m14 30 7-7 5 5 4-4 4 6"></path><circle cx="19" cy="19" r="2"></circle>';
  }
  if (icon === 'chart') {
    return '<path d="M12 34h24"></path><path d="M16 30V22"></path><path d="M24 30V16"></path><path d="M32 30v-9"></path>';
  }
  return '<rect x="11" y="11" width="26" height="26" rx="4"></rect><path d="M24 11v26"></path><path d="M11 24h26"></path>';
}

function renderPlaceholder(element: HTMLElement, props: Props): void {
  const shell = element.firstElementChild as HTMLDivElement | null;
  const icon = shell?.querySelector<SVGElement>('svg');
  const title = shell?.querySelector<HTMLDivElement>('[data-placeholder-title]');
  const body = shell?.querySelector<HTMLDivElement>('[data-placeholder-body]');
  if (!shell || !icon || !title || !body) return;

  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.gap = '10px';
  shell.style.padding = '16px';
  shell.style.borderRadius = `${props.cornerRadius}px`;
  shell.style.border = `${props.borderWidth}px ${props.borderStyle} ${props.borderColor}`;
  shell.style.background = props.backgroundColor;
  shell.style.opacity = String(props.opacity);
  shell.style.textAlign = 'center';

  icon.setAttribute('viewBox', '0 0 48 48');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', props.accentColor);
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.innerHTML = getIcon(props.icon);
  icon.style.width = '42px';
  icon.style.height = '42px';

  title.textContent = props.title;
  title.style.fontSize = `${props.titleFontSize}px`;
  title.style.fontWeight = '700';
  title.style.color = props.accentColor;

  body.textContent = props.description;
  body.style.fontSize = `${props.bodyFontSize}px`;
  body.style.lineHeight = '1.5';
  body.style.color = props.accentColor;
  body.style.whiteSpace = 'pre-wrap';
  body.style.wordBreak = 'break-word';
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const title = document.createElement('div');
    const body = document.createElement('div');
    title.dataset.placeholderTitle = 'true';
    body.dataset.placeholderBody = 'true';
    shell.append(icon, title, body);
    element.appendChild(shell);
    renderPlaceholder(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderPlaceholder(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
