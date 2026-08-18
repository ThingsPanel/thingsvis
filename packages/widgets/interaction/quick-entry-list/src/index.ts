import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { metadata } from './metadata';
import { PropsSchema, type Props, type QuickEntryItem } from './schema';

const ICON_PATHS: Record<string, string> = {
  bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M8 22v-3M16 22v-3M5 12H3M21 12h-2"/>',
  'book-open': '<path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H11v18H4.5A2.5 2.5 0 0 0 2 22V4.5Z"/><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H13v18h6.5A2.5 2.5 0 0 1 22 22V4.5Z"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7.25A5.7 5.7 0 0 0 19.2 3.3 5.3 5.3 0 0 0 19.05 0S17.86-.38 15 1.5a13.4 13.4 0 0 0-7 0C5.14-.38 3.95 0 3.95 0A5.3 5.3 0 0 0 3.8 3.3a5.7 5.7 0 0 0-1.52 3.95c0 5.63 3.44 6.88 6.72 7.25A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .92-3-1.5-4-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

function createIcon(name: string, color: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '52%');
  svg.setAttribute('height', '52%');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICON_PATHS[name] ?? ICON_PATHS.link ?? '';
  return svg;
}

function resolveNavigation(rawUrl: string, target: QuickEntryItem['target']) {
  const value = rawUrl.trim();
  if (!value) return null;

  const isRelative = value.startsWith('/') && !value.startsWith('//');
  let url: URL;
  try {
    let baseOrigin = window.location.origin;
    if (isRelative && document.referrer) {
      try {
        baseOrigin = new URL(document.referrer).origin;
      } catch {
        baseOrigin = window.location.origin;
      }
    }
    url = new URL(value, baseOrigin);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const isEmbedded = window.top !== window;
  const resolvedTarget = target && target !== 'auto' ? target : isRelative ? (isEmbedded ? '_top' : '_self') : '_blank';
  return { url: url.toString(), target: resolvedTarget };
}

function renderWidget(element: HTMLElement, props: Props, emit?: WidgetOverlayContext['emit']): void {
  element.innerHTML = '';
  element.style.cssText = `
    width: 100%; height: 100%; box-sizing: border-box; overflow: hidden;
    font-family: Inter, "Noto Sans SC", "Microsoft YaHei", sans-serif;
  `;

  const root = document.createElement('section');
  root.style.cssText = 'display:flex; flex-direction:column; width:100%; height:100%; box-sizing:border-box;';

  if (props.showTitle && props.title) {
    const heading = document.createElement('div');
    heading.textContent = props.title;
    heading.style.cssText = `padding:18px ${props.itemPadding}px 8px; color:${props.textColor}; font-size:${props.titleFontSize}px; font-weight:600; line-height:1.4; flex:none;`;
    root.appendChild(heading);
  }

  const list = document.createElement('div');
  list.setAttribute('role', 'list');
  list.style.cssText = 'min-height:0; flex:1; overflow:auto; padding:2px 0;';

  props.items.forEach((item, index) => {
    const entry = document.createElement('button');
    entry.type = 'button';
    entry.disabled = item.disabled;
    entry.setAttribute('role', 'listitem');
    entry.setAttribute('aria-label', item.title);
    entry.style.cssText = `
      position:relative; display:flex; align-items:center; gap:16px; width:100%;
      padding:${props.itemPadding}px; border:0; background:transparent; color:inherit;
      text-align:left; font:inherit; cursor:${item.disabled ? 'not-allowed' : 'pointer'};
      opacity:${item.disabled ? 0.5 : 1}; transition:background-color .16s ease; outline:none;
    `;

    if (props.showDivider && index > 0) {
      entry.style.borderTop = `1px solid ${props.dividerColor}`;
    }
    entry.addEventListener('mouseenter', () => {
      if (!item.disabled) entry.style.backgroundColor = props.hoverColor;
    });
    entry.addEventListener('mouseleave', () => {
      entry.style.backgroundColor = 'transparent';
    });
    entry.addEventListener('focus', () => {
      entry.style.boxShadow = 'inset 0 0 0 2px rgba(79,103,255,.28)';
    });
    entry.addEventListener('blur', () => {
      entry.style.boxShadow = 'none';
    });

    const iconWrap = document.createElement('span');
    iconWrap.style.cssText = `
      flex:0 0 ${props.iconSize}px; width:${props.iconSize}px; height:${props.iconSize}px;
      display:flex; align-items:center; justify-content:center; border-radius:50%;
      background:${item.iconBackgroundColor || '#eef1ff'};
    `;
    iconWrap.appendChild(createIcon(item.icon || 'link', item.iconColor || '#4f67ff'));

    const content = document.createElement('span');
    content.style.cssText = 'display:flex; flex:1; min-width:0; flex-direction:column; gap:4px;';
    const title = document.createElement('span');
    title.textContent = item.title;
    title.style.cssText = `overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:${props.textColor}; font-size:${props.itemTitleFontSize}px; font-weight:600; line-height:1.4;`;
    content.appendChild(title);
    if (item.description) {
      const description = document.createElement('span');
      description.textContent = item.description;
      description.style.cssText = `overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:${props.descriptionColor}; font-size:${props.descriptionFontSize}px; line-height:1.45;`;
      content.appendChild(description);
    }

    const chevron = document.createElement('span');
    chevron.textContent = '›';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.style.cssText = `flex:none; color:${props.descriptionColor}; font:400 30px/1 Arial, sans-serif; transform:translateY(-1px);`;

    entry.append(iconWrap, content, chevron);
    entry.addEventListener('click', () => {
      if (item.disabled) return;
      emit?.('itemClick', { id: item.id, title: item.title, url: item.url, index });
      const navigation = resolveNavigation(item.url || '', item.target);
      if (navigation) window.open(navigation.url, navigation.target, navigation.target === '_blank' ? 'noopener,noreferrer' : undefined);
    });
    list.appendChild(entry);
  });

  root.appendChild(list);
  element.appendChild(root);
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentEmit = ctx.emit;
    renderWidget(element, currentProps, currentEmit);

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentEmit = nextCtx.emit;
        renderWidget(element, currentProps, currentEmit);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
