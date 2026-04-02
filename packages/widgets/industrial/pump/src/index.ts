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
    <radialGradient id="pumpHousingGrad" cx="38%" cy="32%" r="62%">
      <stop offset="0%" style="stop-color:${lightenColor(currentBaseColor, 30)};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${lightenColor(currentBaseColor, 8)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(currentBaseColor, 18)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="pumpPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(currentBaseColor, 18)};stop-opacity:1" />
      <stop offset="45%" style="stop-color:${lightenColor(currentBaseColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(currentBaseColor, 8)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="pumpFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(currentBaseColor, 22)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(currentBaseColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(impellerColor, 22)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(impellerColor, 8)};stop-opacity:0.88" />
    </linearGradient>
  </defs>

  <!-- 左管道 -->
  <rect x="0" y="24" width="16" height="12" fill="url(#pumpPipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="${lightenColor(currentBaseColor, 32)}" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="${darkenColor(currentBaseColor, 22)}" stroke-width="1"/>

  <!-- 左法兰 -->
  <rect x="15" y="19" width="6" height="22" rx="1" fill="url(#pumpFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="${lightenColor(currentBaseColor, 28)}" stroke-width="0.8" opacity="0.6"/>

  <!-- 右管道 -->
  <rect x="84" y="24" width="16" height="12" fill="url(#pumpPipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="${lightenColor(currentBaseColor, 32)}" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="${darkenColor(currentBaseColor, 22)}" stroke-width="1"/>

  <!-- 右法兰 -->
  <rect x="79" y="19" width="6" height="22" rx="1" fill="url(#pumpFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="${lightenColor(currentBaseColor, 28)}" stroke-width="0.8" opacity="0.6"/>

  <!-- 泵壳阴影 -->
  <circle cx="50" cy="31.5" r="24" fill="${darkenColor(currentBaseColor, 30)}" opacity="0.3"/>

  <!-- 泵壳主体 -->
  <circle cx="50" cy="30" r="24" fill="url(#pumpHousingGrad)" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 泵壳高光弧 -->
  <path d="M 31 19 A 24 24 0 0 1 60 8" fill="none" stroke="${lightenColor(currentBaseColor, 38)}" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>

  <!-- 叶轮 -->
  <g>
    <path d="M 50 30 C 49 21 53 14 50 14 Q 62 21 50 30" fill="url(#bladeGrad)" opacity="0.92"/>
    <path d="M 50 30 C 59 29 66 33 66 30 Q 59 44 50 30" fill="url(#bladeGrad)" opacity="0.82"/>
    <path d="M 50 30 C 51 39 47 46 50 46 Q 38 39 50 30" fill="url(#bladeGrad)" opacity="0.92"/>
    <path d="M 50 30 C 41 31 34 27 34 30 Q 41 16 50 30" fill="url(#bladeGrad)" opacity="0.82"/>

    <!-- 轮毂外环 -->
    <circle cx="50" cy="30" r="7.5" fill="${darkenColor(currentBaseColor, 22)}" stroke="#1e293b" stroke-width="1.5"/>
    <!-- 轮毂内环 -->
    <circle cx="50" cy="30" r="5.5" fill="${lightenColor(currentBaseColor, 6)}" stroke="#0f172a" stroke-width="1"/>
    <!-- 轮毂高光 -->
    <circle cx="48.5" cy="28.5" r="1.8" fill="${lightenColor(currentBaseColor, 38)}" opacity="0.65"/>
    <!-- 中心螺栓 -->
    <circle cx="50" cy="30" r="2" fill="#0f172a"/>

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

  <!-- 故障闪烁 -->
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
