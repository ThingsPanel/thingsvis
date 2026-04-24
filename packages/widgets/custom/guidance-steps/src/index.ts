import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { metadata } from './metadata';
import {
  DEFAULT_GUIDANCE_STEPS_EN,
  DEFAULT_GUIDANCE_STEPS_ZH,
  PropsSchema,
  type Props,
  type StepItem,
} from './schema';

const LEGACY_DEFAULT_GUIDANCE_STEPS: StepItem[] = [
  {
    title: 'Create device',
    description:
      "Let's provision your first device to the platform via UI. Follow the documentation on how to do it:",
    linkText: 'Devices',
    linkUrl: '#',
    actionText: 'How to create Device',
    actionUrl: '#',
  },
  { title: 'Connect device' },
  { title: 'Create dashboard' },
];

function normalizeLocale(locale?: string): 'zh' | 'en' {
  return String(locale ?? '')
    .toLowerCase()
    .startsWith('zh')
    ? 'zh'
    : 'en';
}

function normalizeItems(items: unknown): string {
  if (!Array.isArray(items)) return '[]';
  return JSON.stringify(
    items.map((item) => {
      const record = (item ?? {}) as Partial<StepItem>;
      return {
        title: record.title ?? '',
        description: record.description ?? '',
        linkText: record.linkText ?? '',
        linkUrl: record.linkUrl ?? '',
        actionText: record.actionText ?? '',
        actionUrl: record.actionUrl ?? '',
        actionIcon: record.actionIcon ?? '',
        target: record.target ?? '',
      };
    }),
  );
}

const defaultItemSnapshots = new Set([
  normalizeItems(DEFAULT_GUIDANCE_STEPS_ZH),
  normalizeItems(DEFAULT_GUIDANCE_STEPS_EN),
  normalizeItems(LEGACY_DEFAULT_GUIDANCE_STEPS),
]);

function resolveItems(props: Props, ctx: WidgetOverlayContext): StepItem[] {
  const items = Array.isArray(props.items) ? props.items : [];
  if (items.length > 0 && !defaultItemSnapshots.has(normalizeItems(items))) {
    return items;
  }
  return normalizeLocale(ctx.locale) === 'zh' ? DEFAULT_GUIDANCE_STEPS_ZH : DEFAULT_GUIDANCE_STEPS_EN;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? '';
    const full = raw.length === 3 ? raw.split('').map((item) => item + item).join('') : raw;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return normalized;
}

function isAbsoluteUrl(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith('//');
}

function resolveNavigation(rawUrl: string, configuredTarget?: StepItem['target']) {
  const url = rawUrl.trim();
  if (!url) {
    return { url, target: configuredTarget ?? '_blank' };
  }

  if (isAbsoluteUrl(url)) {
    return { url, target: configuredTarget ?? '_blank' };
  }

  if (url.startsWith('/')) {
    const isEmbedded = window.top !== window;
    let baseOrigin = window.location.origin;
    if (document.referrer) {
      try {
        baseOrigin = new URL(document.referrer).origin;
      } catch {
        baseOrigin = window.location.origin;
      }
    }
    return {
      url: new URL(url, baseOrigin).toString(),
      target: configuredTarget ?? (isEmbedded ? '_top' : '_self'),
    };
  }

  return { url, target: configuredTarget ?? '_blank' };
}

function openConfiguredUrl(rawUrl?: string, configuredTarget?: StepItem['target']) {
  if (!rawUrl) return;
  const { url, target } = resolveNavigation(rawUrl, configuredTarget);
  if (!url) return;
  window.open(url, target);
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentCtx = ctx;
    let activeStep = 0;

    element.style.cssText = `
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow-y: auto;
      font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
    `;
    element.appendChild(container);

    const renderSteps = () => {
      container.innerHTML = '';
      const themeColor = currentProps.themeColor || '#6965db';
      const items = resolveItems(currentProps, currentCtx);

      items.forEach((item, index) => {
        const isActive = activeStep === index;
        const stepEl = document.createElement('div');

        const bgStyle = isActive
          ? `background: ${hexToRgba(themeColor, 0.05)}; padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`
          : 'padding: 12px; cursor: pointer; transition: background 0.2s;';

        stepEl.style.cssText = `
          border-radius: 12px;
          box-sizing: border-box;
          ${bgStyle}
        `;

        if (!isActive) {
          stepEl.addEventListener('mouseenter', () => {
            stepEl.style.background = hexToRgba(themeColor, 0.02);
          });
          stepEl.addEventListener('mouseleave', () => {
            stepEl.style.background = 'transparent';
          });
          stepEl.addEventListener('click', () => {
            activeStep = index;
            renderSteps();
          });
        }

        const headerEl = document.createElement('div');
        headerEl.style.cssText = `
          display: flex;
          align-items: center;
          gap: 16px;
        `;

        const numCircle = document.createElement('div');
        numCircle.style.cssText = `
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: ${themeColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        `;
        numCircle.textContent = String(index + 1);
        headerEl.appendChild(numCircle);

        const titleEl = document.createElement('div');
        titleEl.style.cssText = `
          font-size: ${currentProps.titleFontSize}px;
          color: ${isActive ? '#1f2937' : '#4b5563'};
          font-weight: ${isActive ? '700' : '400'};
          flex-grow: 1;
        `;
        titleEl.textContent = item.title || '';
        headerEl.appendChild(titleEl);

        if (item.linkText) {
          const linkEl = document.createElement('a');
          linkEl.href = item.linkUrl || '#';
          linkEl.target = item.target || '_blank';
          linkEl.textContent = item.linkText;
          linkEl.style.cssText = `
            font-size: 14px;
            color: ${themeColor};
            text-decoration: none;
            font-weight: 500;
            white-space: nowrap;
          `;
          linkEl.addEventListener('click', (event) => {
            event.preventDefault();
            openConfiguredUrl(item.linkUrl, item.target);
          });
          headerEl.appendChild(linkEl);
        }

        stepEl.appendChild(headerEl);

        if (isActive || item.description || item.actionText) {
          const contentEl = document.createElement('div');
          contentEl.style.cssText = `
            margin-top: 12px;
            margin-left: 44px;
          `;

          if (item.description) {
            const descEl = document.createElement('p');
            descEl.style.cssText = `
              font-size: ${currentProps.descFontSize}px;
              color: #6b7280;
              line-height: 1.5;
              margin: 0 0 ${item.actionText ? '16px' : '0'} 0;
              white-space: pre-wrap;
            `;
            descEl.textContent = item.description;
            contentEl.appendChild(descEl);
          }

          if (item.actionText) {
            const btnEl = document.createElement('button');
            btnEl.style.cssText = `
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: white;
              border: 1px solid ${hexToRgba(themeColor, 0.3)};
              color: ${themeColor};
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            `;
            btnEl.textContent = item.actionText;
            btnEl.addEventListener('click', () => {
              openConfiguredUrl(item.actionUrl, item.target);
            });
            contentEl.appendChild(btnEl);
          }

          stepEl.appendChild(contentEl);
        }

        container.appendChild(stepEl);
      });
    };

    renderSteps();

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentCtx = nextCtx;
        renderSteps();
      },
      destroy: () => {
        container.innerHTML = '';
      },
    };
  },
});

export default Main;
