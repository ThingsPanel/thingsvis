import { defineWidget, resolveLocaleRecord, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';

const localeCatalog = { zh, en } as const;
type PlaceholderState = 'empty' | 'loading' | 'error' | 'ready';
type RuntimeMessages = {
  runtime: Record<'emptyTitle' | 'emptyDescription' | 'loadingTitle' | 'loadingDescription' | 'errorTitle' | 'errorDescription' | 'retry' | 'openExternal' | 'refresh' | 'fullscreen', string>;
};

const ICONS = {
  refresh: '<path d="M20 11a8.1 8.1 0 1 0 2 5.3"/><path d="M20 4v7h-7"/>',
  external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  webpage: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>',
};

function createIcon(path: string, size = 16): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = path;
  return svg;
}

function safeUrl(input: unknown): string {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  standaloneDefaults: { src: '' },
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentMode = ctx.mode;
    let currentLocale = ctx.locale;
    let currentSrc = '';
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    element.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;box-sizing:border-box;font-family:Inter,"Noto Sans SC","Microsoft YaHei",sans-serif;';
    const shell = document.createElement('section');
    shell.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box;overflow:hidden;background:inherit;';
    element.appendChild(shell);

    const header = document.createElement('header');
    header.style.cssText = 'height:40px;min-height:40px;display:flex;align-items:center;gap:8px;padding:0 12px;box-sizing:border-box;border-bottom:1px solid #e8edf5;background:transparent;color:#172033;';
    const title = document.createElement('div');
    title.style.cssText = 'min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:22px;font-weight:600;';
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;flex:none;';
    header.append(title, toolbar);
    shell.appendChild(header);

    const content = document.createElement('div');
    content.style.cssText = 'position:relative;min-height:0;flex:1;overflow:hidden;';
    shell.appendChild(content);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;display:block;border:none;box-sizing:border-box;background:#fff;';
    iframe.loading = 'lazy';
    content.appendChild(iframe);

    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;text-align:center;background:#fff;color:#64748b;';
    const stateCard = document.createElement('div');
    stateCard.style.cssText = 'display:flex;max-width:320px;flex-direction:column;align-items:center;gap:4px;';
    const stateIcon = document.createElement('div');
    stateIcon.style.cssText = 'display:flex;width:32px;height:32px;align-items:center;justify-content:center;margin-bottom:4px;color:#94a3b8;';
    stateIcon.appendChild(createIcon(ICONS.webpage, 28));
    const stateTitle = document.createElement('div');
    stateTitle.style.cssText = 'font-size:14px;line-height:22px;font-weight:600;color:#334155;';
    const stateDescription = document.createElement('div');
    stateDescription.style.cssText = 'font-size:12px;line-height:20px;color:#64748b;';
    const stateActions = document.createElement('div');
    stateActions.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;';
    stateCard.append(stateIcon, stateTitle, stateDescription, stateActions);
    placeholder.appendChild(stateCard);
    content.appendChild(placeholder);

    const messages = () => (resolveLocaleRecord(localeCatalog, currentLocale) as RuntimeMessages).runtime;
    const clearLoadTimer = () => {
      if (loadTimer) clearTimeout(loadTimer);
      loadTimer = null;
    };
    const openExternal = () => {
      if (currentSrc) window.open(currentSrc, '_blank', 'noopener,noreferrer');
    };

    const actionButton = (label: string, primary: boolean, action: () => void) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.style.cssText = `height:32px;padding:0 12px;border-radius:6px;border:1px solid ${primary ? '#2563eb' : '#dbe2ea'};background:${primary ? '#2563eb' : '#fff'};color:${primary ? '#fff' : '#334155'};font:500 13px/1 inherit;cursor:pointer;`;
      button.addEventListener('click', action);
      return button;
    };

    const updatePlaceholder = (state: PlaceholderState) => {
      const t = messages();
      placeholder.style.display = state === 'ready' ? 'none' : 'flex';
      stateActions.innerHTML = '';
      if (state === 'ready') return;
      if (state === 'empty') {
        stateTitle.textContent = t.emptyTitle;
        stateDescription.textContent = t.emptyDescription;
      } else if (state === 'loading') {
        stateTitle.textContent = t.loadingTitle;
        stateDescription.textContent = t.loadingDescription;
      } else {
        stateTitle.textContent = t.errorTitle;
        stateDescription.textContent = t.errorDescription;
        stateActions.append(actionButton(t.retry, true, () => loadPage(true)), actionButton(t.openExternal, false, openExternal));
      }
    };

    const loadPage = (force = false) => {
      const normalized = safeUrl(currentProps.src);
      currentSrc = normalized;
      clearLoadTimer();
      if (!normalized) {
        iframe.removeAttribute('src');
        updatePlaceholder(currentProps.src.trim() ? 'error' : 'empty');
        return;
      }
      updatePlaceholder('loading');
      if (force || iframe.getAttribute('src') !== normalized) iframe.src = normalized;
      loadTimer = setTimeout(() => updatePlaceholder('error'), currentProps.loadTimeout * 1000);
    };

    const toolButton = (label: string, icon: string, action: () => void) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.title = label;
      button.setAttribute('aria-label', label);
      button.style.cssText = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:6px;background:transparent;color:#64748b;cursor:pointer;outline:none;transition:background-color .15s,color .15s;';
      button.appendChild(createIcon(icon));
      button.addEventListener('mouseenter', () => { button.style.background = 'rgba(0,0,0,.04)'; button.style.color = '#172033'; });
      button.addEventListener('mouseleave', () => { button.style.background = 'transparent'; button.style.color = '#64748b'; });
      button.addEventListener('focus', () => { button.style.outline = '2px solid #2563eb'; button.style.outlineOffset = '2px'; });
      button.addEventListener('blur', () => { button.style.outline = 'none'; });
      button.addEventListener('click', action);
      return button;
    };

    const applySecurity = () => {
      if (currentProps.sandboxEnabled) {
        const permissions = ['allow-scripts', 'allow-same-origin', 'allow-forms'];
        if (currentProps.allowPopups) permissions.push('allow-popups');
        if (currentProps.allowDownloads) permissions.push('allow-downloads');
        iframe.setAttribute('sandbox', permissions.join(' '));
      } else {
        iframe.removeAttribute('sandbox');
      }
      iframe.allowFullscreen = currentProps.allowFullscreen;
      iframe.setAttribute('allow', currentProps.allowFullscreen ? 'fullscreen' : '');
    };

    const updateChrome = () => {
      header.style.display = currentProps.showHeader ? 'flex' : 'none';
      title.textContent = currentProps.title;
      toolbar.innerHTML = '';
      const t = messages();
      if (currentProps.showRefresh) toolbar.appendChild(toolButton(t.refresh, ICONS.refresh, () => loadPage(true)));
      if (currentProps.showOpenExternal) toolbar.appendChild(toolButton(t.openExternal, ICONS.external, openExternal));
      if (currentProps.showFullscreen) toolbar.appendChild(toolButton(t.fullscreen, ICONS.fullscreen, () => { void shell.requestFullscreen?.(); }));
      iframe.style.pointerEvents = currentMode === 'view' ? 'auto' : 'none';
      iframe.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius = `${currentProps.borderRadius}px`;
      content.style.borderRadius = currentProps.showHeader ? `0 0 ${currentProps.borderRadius}px ${currentProps.borderRadius}px` : `${currentProps.borderRadius}px`;
      iframe.style.borderRadius = 'inherit';
      applySecurity();
    };

    const handleLoad = () => { clearLoadTimer(); updatePlaceholder('ready'); };
    const handleError = () => { clearLoadTimer(); updatePlaceholder('error'); };
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);
    updateChrome();
    loadPage();

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        const sourceChanged = nextProps.src !== currentProps.src;
        const timeoutChanged = nextProps.loadTimeout !== currentProps.loadTimeout;
        currentProps = nextProps;
        currentMode = nextCtx.mode;
        currentLocale = nextCtx.locale;
        updateChrome();
        if (sourceChanged || timeoutChanged) loadPage(sourceChanged);
      },
      destroy: () => {
        clearLoadTimer();
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        iframe.removeAttribute('src');
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
