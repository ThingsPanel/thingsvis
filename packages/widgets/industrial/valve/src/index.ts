import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderValve(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const bodyColor = props.hasError ? '#ff4d4f' : '#334155';
  const pipeColor = props.hasError ? '#ff7875' : '#475569';
  const discColor = props.hasError
    ? '#ff7875'
    : (props.isOpen ? props.openColor : props.closedColor);
  const flangeColor = props.hasError ? '#ff7875' : '#64748b';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 -8 100 76" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <radialGradient id="valveBodyGrad" cx="36%" cy="30%" r="64%">
      <stop offset="0%" style="stop-color:${lightenColor(bodyColor, 32)};stop-opacity:1" />
      <stop offset="48%" style="stop-color:${lightenColor(bodyColor, 10)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(bodyColor, 22)};stop-opacity:1" />
    </radialGradient>
    <radialGradient id="valveDiscGrad" cx="34%" cy="30%" r="65%">
      <stop offset="0%" style="stop-color:${lightenColor(discColor, 38)};stop-opacity:1" />
      <stop offset="55%" style="stop-color:${discColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(discColor, 22)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="valvePipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(pipeColor, 20)};stop-opacity:1" />
      <stop offset="42%" style="stop-color:${lightenColor(pipeColor, 30)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(pipeColor, 10)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="valveFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(flangeColor, 16)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(flangeColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
      <stop offset="35%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="65%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
      <stop offset="45%" style="stop-color:#cbd5e1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左管道 -->
  <rect x="0" y="24" width="16" height="12" fill="url(#valvePipeGrad)"/>
  <line x1="0" y1="24" x2="16" y2="24" stroke="${lightenColor(pipeColor, 32)}" stroke-width="1"/>
  <line x1="0" y1="36" x2="16" y2="36" stroke="${darkenColor(pipeColor, 22)}" stroke-width="1"/>

  <!-- 左法兰 -->
  <rect x="15" y="19" width="6" height="22" rx="1" fill="url(#valveFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="16.5" y1="22" x2="16.5" y2="38" stroke="${lightenColor(flangeColor, 22)}" stroke-width="0.8" opacity="0.6"/>

  <!-- 右管道 -->
  <rect x="84" y="24" width="16" height="12" fill="url(#valvePipeGrad)"/>
  <line x1="84" y1="24" x2="100" y2="24" stroke="${lightenColor(pipeColor, 32)}" stroke-width="1"/>
  <line x1="84" y1="36" x2="100" y2="36" stroke="${darkenColor(pipeColor, 22)}" stroke-width="1"/>

  <!-- 右法兰 -->
  <rect x="79" y="19" width="6" height="22" rx="1" fill="url(#valveFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="83.5" y1="22" x2="83.5" y2="38" stroke="${lightenColor(flangeColor, 22)}" stroke-width="0.8" opacity="0.6"/>

  <!-- 阀体阴影 -->
  <circle cx="50" cy="31.5" r="24" fill="${darkenColor(bodyColor, 32)}" opacity="0.28"/>

  <!-- 阀体主体 -->
  <circle cx="50" cy="30" r="24" fill="url(#valveBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 阀体高光弧 -->
  <path d="M 33 18 A 24 24 0 0 1 62 8" fill="none" stroke="${lightenColor(bodyColor, 42)}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>

  <!-- 刻度线 -->
  <line x1="50" y1="8" x2="50" y2="12.5" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="47.5" x2="50" y2="52" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="28" y1="30" x2="32.5" y2="30" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="67.5" y1="30" x2="72" y2="30" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>

  <!-- 阀芯 -->
  <circle cx="50" cy="30" r="13" fill="url(#valveDiscGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <ellipse cx="46" cy="26" rx="4" ry="3" fill="white" opacity="0.16"/>

  <!-- 填料函 -->
  <rect x="46" y="7" width="8" height="6" rx="1" fill="${lightenColor(bodyColor, 6)}" stroke="#1e293b" stroke-width="1.5"/>
  <line x1="47" y1="8.5" x2="47" y2="11.5" stroke="${lightenColor(bodyColor, 26)}" stroke-width="0.8" opacity="0.65"/>

  <!-- 阀杆 -->
  <rect x="48" y="-1" width="4" height="8" fill="url(#stemGrad)" stroke="#1e293b" stroke-width="1"/>

  <!-- 手轮底座 -->
  <rect x="46" y="-3" width="8" height="4" rx="1.5" fill="${lightenColor(flangeColor, 12)}" stroke="#1e293b" stroke-width="1"/>

  <!-- 手柄横杆 -->
  <rect x="34" y="-7" width="32" height="5" rx="2.5" fill="url(#handleGrad)" stroke="#1e293b" stroke-width="1.2"/>

  <!-- 手柄防滑纹 -->
  <circle cx="40" cy="-4.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="50" cy="-4.5" r="1" fill="#475569" opacity="0.55"/>
  <circle cx="60" cy="-4.5" r="1" fill="#475569" opacity="0.55"/>

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
    renderValve(element, props);
    return {
      update: (nextProps: Props) => {
        renderValve(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
