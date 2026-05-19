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
    case 'shield-check':
      return '<path d="M24 6 38 11v10c0 9-5.8 16.5-14 21-8.2-4.5-14-12-14-21V11Z"></path><path d="m17.5 24 4.5 4.5 9-10"></path>';
    case 'activity':
      return '<path d="M6 25h8l4-12 8 24 4-12h12"></path>';
    case 'thermometer':
      return '<path d="M24 8a5 5 0 0 0-5 5v15.2a9 9 0 1 0 10 0V13a5 5 0 0 0-5-5Z"></path><path d="M24 17v17"></path>';
    case 'droplet':
      return '<path d="M24 6s12 13 12 22a12 12 0 0 1-24 0C12 19 24 6 24 6Z"></path>';
    case 'gauge':
      return '<path d="M10 33a16 16 0 1 1 28 0"></path><path d="M24 33l8-12"></path><path d="M18 35h12"></path>';
    case 'zap':
      return '<path d="M27 6 14 27h8l-2 15 14-21h-8Z"></path>';
    case 'alert-triangle':
      return '<path d="M24 8 42 39H6Z"></path><path d="M24 19v9"></path><path d="M24 34h.01"></path>';
    case 'check-circle':
      return '<circle cx="24" cy="24" r="16"></circle><path d="m16.5 24 5 5 10-11"></path>';
    case 'x-circle':
      return '<circle cx="24" cy="24" r="16"></circle><path d="m18 18 12 12"></path><path d="m30 18-12 12"></path>';
    case 'trending-up':
      return '<path d="M7 32h8l7-10 7 6 12-15"></path><path d="M31 13h10v10"></path>';
    case 'trending-down':
      return '<path d="M7 16h8l7 10 7-6 12 15"></path><path d="M31 35h10V25"></path>';
    case 'clock':
      return '<circle cx="24" cy="24" r="16"></circle><path d="M24 14v11l7 4"></path>';
    case 'cpu':
      return '<rect x="14" y="14" width="20" height="20" rx="3"></rect><rect x="20" y="20" width="8" height="8" rx="1"></rect><path d="M18 6v8M24 6v8M30 6v8M18 34v8M24 34v8M30 34v8M6 18h8M6 24h8M6 30h8M34 18h8M34 24h8M34 30h8"></path>';
    case 'square':
    default:
      return '<rect x="11" y="11" width="26" height="26" rx="4"></rect>';
  }
}

function normalizeSvgMarkup(svg: string): string {
  const trimmed = svg.trim();
  if (!trimmed.includes('<svg')) return trimmed;
  return trimmed.replace(/<svg\b([^>]*)>/i, (match, attrs: string) => {
    let nextAttrs = attrs ?? '';
    if (!/\bwidth=/i.test(nextAttrs)) nextAttrs += ' width="100%"';
    if (!/\bheight=/i.test(nextAttrs)) nextAttrs += ' height="100%"';
    if (!/\bpreserveAspectRatio=/i.test(nextAttrs)) {
      nextAttrs += ' preserveAspectRatio="xMidYMid meet"';
    }
    return `<svg${nextAttrs}>`;
  });
}

function renderBuiltinIcon(shell: HTMLDivElement, props: Props, fg: string): void {
  const svg = shell.querySelector('svg');
  if (!svg) return;

  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', resolveColor(props.color, fg));
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.innerHTML = getIconMarkup(props.iconName);
}

function renderLocalIcon(shell: HTMLDivElement, svgText: string, color: string): void {
  shell.innerHTML = normalizeSvgMarkup(svgText);
  const svg = shell.querySelector('svg');
  if (!svg) return;
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.display = 'block';
  svg.style.color = color;
}

function renderLocalImage(shell: HTMLDivElement, assetUrl: string): void {
  shell.innerHTML = '';
  if (!assetUrl) return;

  const img = document.createElement('img');
  img.src = assetUrl;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.display = 'block';
  shell.appendChild(img);
}

function applyShellStyle(element: HTMLElement, shell: HTMLDivElement, props: Props): void {
  const colors = resolveWidgetColors(element);

  // Fill the widget container absolutely so the icon doesn't flow into the top-left corner
  shell.style.position = 'absolute';
  shell.style.inset = '0';
  shell.style.width = '100%';
  shell.style.height = '100%';
  shell.style.boxSizing = 'border-box';
  shell.style.display = 'flex';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.padding = '0';
  shell.style.background = 'transparent';
  shell.style.border = 'none';
  shell.style.color = resolveColor(props.color, colors.fg || '#0f172a');
}

function renderIcon(element: HTMLElement, shell: HTMLDivElement, props: Props): void {
  applyShellStyle(element, shell, props);
  const fg = shell.style.color || '#0f172a';

  if (props.iconSource === 'local') {
    if (props.assetKind === 'image') {
      renderLocalImage(shell, props.assetUrl);
      return;
    }

    const svgText = props.svgContent;
    if (svgText?.trim()) {
      renderLocalIcon(shell, svgText, fg);
      return;
    }

    shell.innerHTML = '';
    return;
  }

  shell.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  shell.appendChild(svg);
  renderBuiltinIcon(shell, props, fg);
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props) => {
    // Ensure the host element is a positioning context so the shell can use position:absolute
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    // Reuse existing shell if present (hot-reload or double-render guard)
    let shell = element.querySelector<HTMLDivElement>('.thingsvis-basic-icon-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'thingsvis-basic-icon-shell';
      element.appendChild(shell);
    }

    const shellEl = shell;
    const sync = (nextProps: Props) => {
      renderIcon(element, shellEl, nextProps);
    };

    sync(props);

    return {
      update: (nextProps: Props) => {
        sync(nextProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
