import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderPump(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const currentBaseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const impellerColor = props.hasError ? '#ff7875' : '#0ea5e9';
  const durSec = props.rpm > 0 ? Math.max(60 / props.rpm, 0.05).toFixed(3) : '1';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(currentBaseColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${currentBaseColor};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左短管 -->
  <rect x="0" y="23" width="10" height="14" fill="#475569"/>

  <!-- 右短管 -->
  <rect x="90" y="23" width="10" height="14" fill="#475569"/>

  <rect x="10" y="24" width="16" height="12" fill="${darkenColor(currentBaseColor, 6)}"/>
  <rect x="74" y="24" width="16" height="12" fill="${darkenColor(currentBaseColor, 6)}"/>

  <!-- Pump housing - 主体 -->
  <circle cx="50" cy="30" r="24" fill="url(#pumpGrad)" stroke="#1e293b" stroke-width="2"/>

  <!-- 叶轮 -->
  <g>
    <path d="M 50 30 L 50 15 Q 61 22 50 30" fill="${impellerColor}" opacity="0.9"/>
    <path d="M 50 30 L 65 30 Q 58 45 50 30" fill="${impellerColor}" opacity="0.8"/>
    <path d="M 50 30 L 50 45 Q 39 38 50 30" fill="${impellerColor}" opacity="0.9"/>
    <path d="M 50 30 L 35 30 Q 42 15 50 30" fill="${impellerColor}" opacity="0.8"/>
    <circle cx="50" cy="30" r="4.5" fill="#1e293b" stroke="#1e293b" stroke-width="1"/>

    ${props.isRunning && props.rpm > 0 ? `
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 50 30"
      to="360 50 30"
      dur="${durSec}s"
      repeatCount="indefinite"
    />
    ` : ''}
  </g>

  <!-- Fault pulse -->
  ${props.hasError ? `
  <circle cx="50" cy="30" r="24" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </circle>
  ` : ''}
</svg>
`;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    renderPump(element, props);
    return {
      update: (nextProps: Props) => renderPump(element, nextProps),
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
