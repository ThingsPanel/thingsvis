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

const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const ARABIC_NUMERALS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props, _ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let colors: WidgetColors = resolveWidgetColors(element);
    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    element.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.style.cssText = 'width: 100%; height: 100%; max-width: 100%; max-height: 100%;';

    // Definitions for gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Dial gradient
    const dialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    dialGradient.setAttribute('id', 'dialGrad');
    dialGradient.setAttribute('cx', '50%');
    dialGradient.setAttribute('cy', '50%');
    dialGradient.setAttribute('r', '50%');
    dialGradient.innerHTML = `
      <stop offset="0%" stop-color="var(--dial-center, #f8f9fa)" />
      <stop offset="85%" stop-color="var(--dial-outer, #e9ecef)" />
      <stop offset="100%" stop-color="var(--dial-edge, #dee2e6)" />
    `;
    
    // Hand gradient
    const handGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    handGradient.setAttribute('id', 'handGrad');
    handGradient.setAttribute('x1', '0%');
    handGradient.setAttribute('y1', '0%');
    handGradient.setAttribute('x2', '100%');
    handGradient.setAttribute('y2', '0%');
    handGradient.innerHTML = `
      <stop offset="0%" stop-color="var(--hand-dark, #1a1a1a)" />
      <stop offset="50%" stop-color="var(--hand-mid, #333)" />
      <stop offset="100%" stop-color="var(--hand-dark, #1a1a1a)" />
    `;

    defs.appendChild(dialGradient);
    defs.appendChild(handGradient);
    svg.appendChild(defs);

    // Outer ring
    const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('cx', '100');
    outerRing.setAttribute('cy', '100');
    outerRing.setAttribute('r', '98');
    outerRing.setAttribute('fill', 'none');
    outerRing.setAttribute('stroke', 'var(--ring-color, #c0c0c0)');
    outerRing.setAttribute('stroke-width', '2');
    svg.appendChild(outerRing);

    // Inner ring
    const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerRing.setAttribute('cx', '100');
    innerRing.setAttribute('cy', '100');
    innerRing.setAttribute('r', '90');
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', 'var(--ring-inner, #d0d0d0)');
    innerRing.setAttribute('stroke-width', '0.5');
    svg.appendChild(innerRing);

    // Dial face
    const dial = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dial.setAttribute('cx', '100');
    dial.setAttribute('cy', '100');
    dial.setAttribute('r', '89');
    dial.setAttribute('fill', 'url(#dialGrad)');
    svg.appendChild(dial);

    // Ticks group
    const ticksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(ticksGroup);

    // Numbers group
    const numbersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(numbersGroup);

    // Brand text
    const brandText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    brandText.setAttribute('x', '100');
    brandText.setAttribute('y', '70');
    brandText.setAttribute('text-anchor', 'middle');
    brandText.setAttribute('font-size', '6');
    brandText.setAttribute('font-weight', '500');
    brandText.setAttribute('letter-spacing', '2');
    brandText.setAttribute('fill', 'var(--text-secondary, #888)');
    brandText.textContent = 'THINGSVIS';
    svg.appendChild(brandText);

    // Hour hand
    const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const hourHandPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hourHandPath.setAttribute('d', 'M97,100 L97,55 Q97,52 100,52 Q103,52 103,55 L103,100 Q100,102 97,100');
    hourHandPath.setAttribute('fill', 'url(#handGrad)');
    hourHand.appendChild(hourHandPath);
    svg.appendChild(hourHand);

    // Minute hand
    const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const minuteHandPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    minuteHandPath.setAttribute('d', 'M98.5,100 L98.5,38 Q98.5,35 100,35 Q101.5,35 101.5,38 L101.5,100 Q100,101 98.5,100');
    minuteHandPath.setAttribute('fill', 'url(#handGrad)');
    minuteHand.appendChild(minuteHandPath);
    svg.appendChild(minuteHand);

    // Second hand
    const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const secondHandPath = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    secondHandPath.setAttribute('x1', '100');
    secondHandPath.setAttribute('y1', '115');
    secondHandPath.setAttribute('x2', '100');
    secondHandPath.setAttribute('y2', '32');
    secondHandPath.setAttribute('stroke', 'var(--accent, #e74c3c)');
    secondHandPath.setAttribute('stroke-width', '0.8');
    secondHand.appendChild(secondHandPath);
    
    // Second hand counterweight
    const secondWeight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    secondWeight.setAttribute('cx', '100');
    secondWeight.setAttribute('cy', '118');
    secondWeight.setAttribute('r', '4');
    secondWeight.setAttribute('fill', 'var(--accent, #e74c3c)');
    secondHand.appendChild(secondWeight);
    svg.appendChild(secondHand);

    // Center cap
    const centerCap = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCap.setAttribute('cx', '100');
    centerCap.setAttribute('cy', '100');
    centerCap.setAttribute('r', '4');
    centerCap.setAttribute('fill', 'var(--hand-dark, #1a1a1a)');
    svg.appendChild(centerCap);

    // Center dot
    const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerDot.setAttribute('cx', '100');
    centerDot.setAttribute('cy', '100');
    centerDot.setAttribute('r', '1.5');
    centerDot.setAttribute('fill', 'var(--accent, #e74c3c)');
    svg.appendChild(centerDot);

    element.appendChild(svg);

    // Create ticks
    const tickEls: SVGLineElement[] = [];
    for (let i = 0; i < 60; i++) {
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const isHour = i % 5 === 0;
      const angle = (i * 6 - 90) * Math.PI / 180;
      const innerR = isHour ? 82 : 86;
      const outerR = isHour ? 88 : 88;
      
      tick.setAttribute('x1', String(100 + innerR * Math.cos(angle)));
      tick.setAttribute('y1', String(100 + innerR * Math.sin(angle)));
      tick.setAttribute('x2', String(100 + outerR * Math.cos(angle)));
      tick.setAttribute('y2', String(100 + outerR * Math.sin(angle)));
      tick.setAttribute('stroke', isHour ? 'var(--tick-hour, #333)' : 'var(--tick-min, #999)');
      tick.setAttribute('stroke-width', isHour ? '1.5' : '0.5');
      tick.setAttribute('stroke-linecap', 'round');
      ticksGroup.appendChild(tick);
      tickEls.push(tick);
    }

    // Create numbers
    const numberEls: SVGTextElement[] = [];
    for (let i = 0; i < 12; i++) {
      const num = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const angle = (i * 30 - 90) * Math.PI / 180;
      const r = 72;
      num.setAttribute('x', String(100 + r * Math.cos(angle)));
      num.setAttribute('y', String(100 + r * Math.sin(angle)));
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('dominant-baseline', 'middle');
      num.setAttribute('font-size', i % 3 === 0 ? '14' : '11');
      num.setAttribute('font-weight', i % 3 === 0 ? '600' : '400');
      num.setAttribute('fill', 'var(--text-primary, #333)');
      numbersGroup.appendChild(num);
      numberEls.push(num);
    }

    const updateTheme = () => {
      colors = resolveWidgetColors(element);
      const accent = resolveLayeredColor({
        instance: currentProps.accentColor,
        theme: colors.primary,
        fallback: '#e74c3c',
      });
      
      const isDark = element.closest('[data-theme="dark"]') !== null ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (isDark) {
        element.style.setProperty('--dial-center', '#2a2a2a');
        element.style.setProperty('--dial-outer', '#1f1f1f');
        element.style.setProperty('--dial-edge', '#151515');
        element.style.setProperty('--ring-color', 'rgba(255,255,255,0.15)');
        element.style.setProperty('--ring-inner', 'rgba(255,255,255,0.08)');
        element.style.setProperty('--hand-dark', '#f0f0f0');
        element.style.setProperty('--hand-mid', '#d0d0d0');
        element.style.setProperty('--tick-hour', 'rgba(255,255,255,0.9)');
        element.style.setProperty('--tick-min', 'rgba(255,255,255,0.4)');
        element.style.setProperty('--text-primary', 'rgba(255,255,255,0.9)');
        element.style.setProperty('--text-secondary', 'rgba(255,255,255,0.5)');
      } else {
        element.style.setProperty('--dial-center', '#ffffff');
        element.style.setProperty('--dial-outer', '#f8f9fa');
        element.style.setProperty('--dial-edge', '#e9ecef');
        element.style.setProperty('--ring-color', '#d0d0d0');
        element.style.setProperty('--ring-inner', '#e0e0e0');
        element.style.setProperty('--hand-dark', '#1a1a1a');
        element.style.setProperty('--hand-mid', '#4a4a4a');
        element.style.setProperty('--tick-hour', '#333');
        element.style.setProperty('--tick-min', '#bbb');
        element.style.setProperty('--text-primary', '#333');
        element.style.setProperty('--text-secondary', '#888');
      }
      
      element.style.setProperty('--accent', accent);
    };

    const updateVisibility = () => {
      ticksGroup.style.display = currentProps.showTicks ? 'block' : 'none';
      numbersGroup.style.display = currentProps.showNumbers ? 'block' : 'none';
      secondHand.style.display = currentProps.showSecondHand ? 'block' : 'none';
      centerDot.style.display = currentProps.showSecondHand ? 'block' : 'none';
      
      const numerals = currentProps.romanNumerals ? ROMAN_NUMERALS : ARABIC_NUMERALS;
      numberEls.forEach((el, i) => {
        el.textContent = numerals[i] ?? '';
      });
    };

    const render = () => {
      const now = resolveNow(currentProps.timeZone);
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const ms = now.getMilliseconds();
      
      const smoothSeconds = currentProps.smoothSweep 
        ? seconds + ms / 1000 
        : seconds;
      
      const hourAngle = hours * 30 + minutes * 0.5;
      const minuteAngle = minutes * 6 + seconds * 0.1;
      const secondAngle = smoothSeconds * 6;
      
      hourHand.setAttribute('transform', `rotate(${hourAngle}, 100, 100)`);
      minuteHand.setAttribute('transform', `rotate(${minuteAngle}, 100, 100)`);
      secondHand.setAttribute('transform', `rotate(${secondAngle}, 100, 100)`);
    };

    const animate = () => {
      render();
      rafId = requestAnimationFrame(animate);
    };

    const start = () => {
      updateTheme();
      updateVisibility();
      if (rafId) cancelAnimationFrame(rafId);
      animate();
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateTheme();
      });
      resizeObserver.observe(element);
    }

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      updateTheme();
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-theme'] });

    start();

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        updateTheme();
        updateVisibility();
      },
      destroy: () => {
        if (rafId) cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();
        observer.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
