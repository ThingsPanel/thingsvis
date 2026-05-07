import { defineWidget, resolveWidgetColors } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { metadata } from './metadata';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

function getItems(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getMarker(index: number, bulletStyle: Props['bulletStyle']): string {
  if (bulletStyle === 'number') return `${index + 1}.`;
  if (bulletStyle === 'check') return '[x]';
  return '*';
}

function renderList(element: HTMLElement, props: Props): void {
  const colors = resolveWidgetColors(element);
  const shell = element.firstElementChild as HTMLDivElement | null;
  const title = shell?.querySelector<HTMLDivElement>('[data-list-title]');
  const body = shell?.querySelector<HTMLDivElement>('[data-list-body]');
  if (!shell || !title || !body) return;

  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  shell.style.padding = `${props.paddingSize}px`;
  shell.style.borderRadius = `${props.cornerRadius}px`;
  shell.style.border = `${props.borderWidth}px solid ${props.borderColor}`;
  shell.style.background = props.backgroundColor;

  title.style.display = props.showTitle ? 'block' : 'none';
  title.textContent = props.title;
  title.style.marginBottom = props.showTitle ? '12px' : '0';
  title.style.fontSize = `${props.titleFontSize}px`;
  title.style.fontWeight = '700';
  title.style.color = resolveColor(props.titleColor, colors.fg || '#0f172a');

  const items = getItems(props.itemsText);
  body.innerHTML = '';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = `${props.rowGap}px`;
  body.style.fontSize = `${props.fontSize}px`;
  body.style.color = resolveColor(props.textColor, colors.fg || '#334155');
  body.style.flex = '1 1 auto';

  for (const [index, itemText] of items.entries()) {
    const row = document.createElement('div');
    const marker = document.createElement('span');
    const text = document.createElement('span');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '20px 1fr';
    row.style.alignItems = 'start';
    row.style.columnGap = '8px';
    marker.textContent = getMarker(index, props.bulletStyle);
    marker.style.color = props.accentColor;
    marker.style.fontWeight = '700';
    text.textContent = itemText;
    text.style.whiteSpace = 'pre-wrap';
    text.style.wordBreak = 'break-word';
    row.append(marker, text);
    body.appendChild(row);
  }
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    const title = document.createElement('div');
    const body = document.createElement('div');
    title.dataset.listTitle = 'true';
    body.dataset.listBody = 'true';
    shell.append(title, body);
    element.appendChild(shell);
    renderList(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderList(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
