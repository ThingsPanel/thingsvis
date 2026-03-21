import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

function resolveFormatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const normalizedTimeZone = timeZone.trim();
  try {
    return new Intl.DateTimeFormat(locale, {
      ...options,
      ...(normalizedTimeZone ? { timeZone: normalizedTimeZone } : {}),
    });
  } catch {
    return new Intl.DateTimeFormat(locale, options);
  }
}

function getHorizontalAlign(align: Props['align']): string {
  if (align === 'left') return 'flex-start';
  if (align === 'right') return 'flex-end';
  return 'center';
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentCtx = ctx;
    let colors: WidgetColors = resolveWidgetColors(element);
    let timer: number | null = null;

    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.boxSizing = 'border-box';
    element.style.padding = '12px 18px';

    const stackEl = document.createElement('div');
    stackEl.style.display = 'flex';
    stackEl.style.flexDirection = 'column';
    stackEl.style.gap = '8px';
    stackEl.style.width = '100%';
    stackEl.style.height = '100%';
    stackEl.style.justifyContent = 'center';
    element.appendChild(stackEl);

    const timeEl = document.createElement('div');
    timeEl.style.fontWeight = '700';
    timeEl.style.letterSpacing = '0.04em';
    stackEl.appendChild(timeEl);

    const dateEl = document.createElement('div');
    dateEl.style.fontWeight = '500';
    dateEl.style.opacity = '0.78';
    stackEl.appendChild(dateEl);

    const renderClock = () => {
      colors = resolveWidgetColors(element);
      stackEl.style.alignItems = getHorizontalAlign(currentProps.align);
      timeEl.style.textAlign = currentProps.align;
      dateEl.style.textAlign = currentProps.align;
      timeEl.style.color = resolveLayeredColor({
        instance: currentProps.timeColor,
        theme: colors.fg,
        fallback: colors.fg,
      });
      dateEl.style.color = resolveLayeredColor({
        instance: currentProps.dateColor,
        theme: colors.fg,
        fallback: colors.fg,
      });
      timeEl.style.fontSize = `${currentProps.timeFontSize}px`;
      dateEl.style.fontSize = `${currentProps.dateFontSize}px`;

      const timeFormatter = resolveFormatter(
        currentCtx.locale || 'en',
        currentProps.timeZone,
        {
          hour: '2-digit',
          minute: '2-digit',
          ...(currentProps.showSeconds ? { second: '2-digit' } : {}),
          hour12: currentProps.hourCycle === '12h',
        },
      );
      const dateFormatter = resolveFormatter(
        currentCtx.locale || 'en',
        currentProps.timeZone,
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      const now = new Date();
      timeEl.textContent = timeFormatter.format(now);
      dateEl.textContent = currentProps.showDate ? dateFormatter.format(now) : '';
      dateEl.style.display = currentProps.showDate ? 'block' : 'none';
    };

    const schedule = () => {
      if (timer != null) {
        window.clearInterval(timer);
      }
      renderClock();
      timer = window.setInterval(renderClock, currentProps.showSeconds ? 1000 : 30000);
    };

    schedule();

    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentCtx = nextCtx;
        schedule();
      },
      destroy: () => {
        if (timer != null) {
          window.clearInterval(timer);
        }
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
