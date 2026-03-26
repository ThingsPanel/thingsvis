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

function resolveNow(timeZone: string): Date {
  const normalizedTimeZone = timeZone.trim();
  if (!normalizedTimeZone) return new Date();

  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: normalizedTimeZone }));
  } catch {
    return new Date();
  }
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props, _ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let colors: WidgetColors = resolveWidgetColors(element);
    let timer: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.boxSizing = 'border-box';

    const faceEl = document.createElement('div');
    faceEl.style.position = 'relative';
    faceEl.style.borderRadius = '9999px';
    faceEl.style.display = 'flex';
    faceEl.style.alignItems = 'center';
    faceEl.style.justifyContent = 'center';
    faceEl.style.boxSizing = 'border-box';
    faceEl.style.overflow = 'hidden';
    faceEl.style.background = 'radial-gradient(circle at 30% 25%, #1f2236, #07090f 72%)';
    element.appendChild(faceEl);

    const ticksEl = document.createElement('div');
    ticksEl.style.position = 'absolute';
    ticksEl.style.inset = '0';
    ticksEl.style.display = 'none';
    faceEl.appendChild(ticksEl);

    const numbersEl = document.createElement('div');
    numbersEl.style.position = 'absolute';
    numbersEl.style.inset = '0';
    faceEl.appendChild(numbersEl);

    const hourHand = document.createElement('div');
    const minuteHand = document.createElement('div');
    const secondHand = document.createElement('div');
    const hubEl = document.createElement('div');

    [hourHand, minuteHand, secondHand].forEach((hand) => {
      hand.style.position = 'absolute';
      hand.style.left = '50%';
      hand.style.bottom = '50%';
      hand.style.transformOrigin = '50% 100%';
      hand.style.borderRadius = '999px';
    });

    hourHand.style.width = '10px';
    minuteHand.style.width = '8px';
    secondHand.style.width = '3px';

    hubEl.style.position = 'absolute';
    hubEl.style.width = '18px';
    hubEl.style.height = '18px';
    hubEl.style.borderRadius = '9999px';
    hubEl.style.left = '50%';
    hubEl.style.top = '50%';
    hubEl.style.transform = 'translate(-50%, -50%)';

    faceEl.appendChild(hourHand);
    faceEl.appendChild(minuteHand);
    faceEl.appendChild(secondHand);
    faceEl.appendChild(hubEl);

    const numberEls = Array.from({ length: 12 }, (_, index) => {
      const el = document.createElement('div');
      el.textContent = String(index + 1);
      el.style.position = 'absolute';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.fontWeight = '600';
      el.style.lineHeight = '1';
      el.style.textAlign = 'center';
      el.style.whiteSpace = 'nowrap';
      numbersEl.appendChild(el);
      return el;
    });

    const tickEls = Array.from({ length: 60 }, () => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.transformOrigin = '50% 0';
      ticksEl.appendChild(el);
      return el;
    });

    const updateLayout = () => {
      const dimension = Math.max(100, Math.min(element.clientWidth || 260, element.clientHeight || 260));
      const bezelWidth = Math.min(currentProps.bezelWidth, Math.max(4, dimension * 0.14));
      const dialDimension = Math.max(0, dimension - bezelWidth * 2);
      const dialRadius = dialDimension / 2;
      const numberFontSize = Math.max(12, Math.round(dimension * 0.075));
      const numberBoxSize = Math.max(numberFontSize * 1.4, 26);
      const numberMargin = Math.max(bezelWidth * 0.45, numberFontSize * 0.45, 8);
      const markerRadius = Math.max(dialRadius * 0.48, dialRadius - numberBoxSize / 2 - numberMargin);

      faceEl.style.width = `${dimension}px`;
      faceEl.style.height = `${dimension}px`;
      faceEl.style.border = `${bezelWidth}px solid ${resolveLayeredColor({
        instance: currentProps.bezelColor,
        component: 'rgba(255,255,255,0.08)',
        fallback: 'rgba(255,255,255,0.08)',
      })}`;
      faceEl.style.boxShadow = 'none';
      ticksEl.style.inset = '0';
      numbersEl.style.inset = '0';

      numberEls.forEach((numberEl, index) => {
        const angle = ((index + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        numberEl.style.display = currentProps.showNumbers ? 'flex' : 'none';
        numberEl.style.left = `${dialRadius + Math.cos(angle) * markerRadius}px`;
        numberEl.style.top = `${dialRadius + Math.sin(angle) * markerRadius}px`;
        numberEl.style.fontSize = `${numberFontSize}px`;
        numberEl.style.width = `${numberBoxSize}px`;
        numberEl.style.height = `${numberBoxSize}px`;
      });

      hourHand.style.width = `${Math.max(8, Math.round(dimension * 0.067))}px`;
      minuteHand.style.width = `${Math.max(6, Math.round(dimension * 0.053))}px`;
      secondHand.style.width = `${Math.max(2, Math.round(dimension * 0.02))}px`;
      hourHand.style.height = `${dimension * 0.24}px`;
      minuteHand.style.height = `${dimension * 0.34}px`;
      secondHand.style.height = `${dimension * 0.38}px`;
      hubEl.style.width = `${Math.max(14, Math.round(dimension * 0.12))}px`;
      hubEl.style.height = `${Math.max(14, Math.round(dimension * 0.12))}px`;
      hubEl.style.borderWidth = `${Math.max(3, Math.round(dimension * 0.027))}px`;
    };

    const renderClock = () => {
      colors = resolveWidgetColors(element);
      faceEl.style.background = resolveLayeredColor({
        instance: currentProps.dialColor,
        component: 'radial-gradient(circle at 30% 25%, #1f2236, #07090f 72%)',
        fallback: 'radial-gradient(circle at 30% 25%, #1f2236, #07090f 72%)',
      });
      const now = resolveNow(currentProps.timeZone);
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      numberEls.forEach((numberEl) => {
        numberEl.style.color = resolveLayeredColor({
          instance: currentProps.numberColor,
          theme: colors.fg,
          fallback: colors.fg,
        });
      });
      hourHand.style.background = resolveLayeredColor({
        instance: currentProps.hourHandColor,
        component: '#b874ff',
        fallback: '#b874ff',
      });
      minuteHand.style.background = resolveLayeredColor({
        instance: currentProps.minuteHandColor,
        component: '#b874ff',
        fallback: '#b874ff',
      });
      secondHand.style.background = resolveLayeredColor({
        instance: currentProps.secondHandColor,
        theme: colors.primary,
        fallback: colors.primary,
      });
      secondHand.style.display = currentProps.showSecondHand ? 'block' : 'none';
      hubEl.style.background = resolveLayeredColor({
        instance: currentProps.centerColor,
        component: 'rgba(255,255,255,0.12)',
        fallback: 'rgba(255,255,255,0.12)',
      });
      hubEl.style.border = `4px solid ${resolveLayeredColor({
        instance: currentProps.centerBorderColor,
        theme: colors.primary,
        fallback: colors.primary,
      })}`;

      hourHand.style.transform = `translateX(-50%) rotate(${hours * 30 + minutes * 0.5}deg)`;
      minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6 + seconds * 0.1}deg)`;
      secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
    };

    const schedule = () => {
      if (timer != null) {
        window.clearInterval(timer);
      }
      updateLayout();
      renderClock();
      timer = window.setInterval(renderClock, 1000);
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateLayout();
        renderClock();
      });
      resizeObserver.observe(element);
    }

    schedule();

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        schedule();
      },
      destroy: () => {
        if (timer != null) {
          window.clearInterval(timer);
        }
        resizeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
