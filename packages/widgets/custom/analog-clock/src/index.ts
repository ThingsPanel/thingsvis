import {
  defineWidget,
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
      el.style.transform = 'translate(-50%, -50%)';
      el.style.fontWeight = '600';
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
      const dimension = Math.max(120, Math.min(element.clientWidth || 260, element.clientHeight || 260));
      const radius = dimension / 2;
      const markerRadius = radius * 0.78;

      faceEl.style.width = `${dimension}px`;
      faceEl.style.height = `${dimension}px`;
      faceEl.style.border = `${currentProps.bezelWidth}px solid rgba(255,255,255,0.08)`;
      faceEl.style.boxShadow = 'none';

      numberEls.forEach((numberEl, index) => {
        const angle = ((index + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        numberEl.style.display = currentProps.showNumbers ? 'block' : 'none';
        numberEl.style.left = `${radius + Math.cos(angle) * markerRadius}px`;
        numberEl.style.top = `${radius + Math.sin(angle) * markerRadius}px`;
        numberEl.style.fontSize = `${Math.max(16, Math.round(dimension * 0.085))}px`;
      });

      hourHand.style.height = `${dimension * 0.24}px`;
      minuteHand.style.height = `${dimension * 0.34}px`;
      secondHand.style.height = `${dimension * 0.38}px`;
    };

    const renderClock = () => {
      colors = resolveWidgetColors(element);
      const now = resolveNow(currentProps.timeZone);
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      numberEls.forEach((numberEl) => {
        numberEl.style.color = colors.fg;
      });
      hourHand.style.background = '#b874ff';
      minuteHand.style.background = '#b874ff';
      secondHand.style.background = colors.primary;
      secondHand.style.display = currentProps.showSecondHand ? 'block' : 'none';
      hubEl.style.background = 'rgba(255,255,255,0.12)';
      hubEl.style.border = `4px solid ${colors.primary}`;

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
