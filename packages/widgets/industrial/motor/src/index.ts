import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderMotor(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.display = 'block';
  element.style.lineHeight = '0';

  const baseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const runColor = props.hasError ? '#ff7875' : '#0ea5e9';
  const fanDuration = props.rpm > 0 ? `${Math.max(1 / props.rpm, 0.2).toFixed(2)}s` : '0s';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <radialGradient id="motorBodyGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 28)};stop-opacity:1" />
      <stop offset="55%" style="stop-color:${lightenColor(baseColor, 6)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 22)};stop-opacity:1" />
    </radialGradient>
    <linearGradient id="motorPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 18)};stop-opacity:1" />
      <stop offset="42%" style="stop-color:${lightenColor(baseColor, 28)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 8)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="motorFlangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(baseColor, 18)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 12)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="motorEndCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(baseColor, 15)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(baseColor, 5)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="fanBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(runColor, 22)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${darkenColor(runColor, 8)};stop-opacity:0.88" />
    </linearGradient>
  </defs>

  <!-- 左接口管道 -->
  <rect x="0" y="24" width="10" height="12" fill="url(#motorPipeGrad)"/>
  <line x1="0" y1="24" x2="10" y2="24" stroke="${lightenColor(baseColor, 32)}" stroke-width="1"/>
  <line x1="0" y1="36" x2="10" y2="36" stroke="${darkenColor(baseColor, 22)}" stroke-width="1"/>
  <!-- 左法兰 -->
  <rect x="9" y="19" width="6" height="22" rx="1" fill="url(#motorFlangeGrad)" stroke="#1e293b" stroke-width="1"/>
  <line x1="10.5" y1="22" x2="10.5" y2="38" stroke="${lightenColor(baseColor, 28)}" stroke-width="0.8" opacity="0.55"/>

  <!-- 电机主体阴影 -->
  <rect x="15" y="8.5" width="86" height="46" rx="3" fill="${darkenColor(baseColor, 30)}" opacity="0.22"/>
  <!-- 电机主体 -->
  <rect x="15" y="7" width="86" height="46" rx="3" fill="url(#motorBodyGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <!-- 高光弧 -->
  <path d="M 17 9 L 75 9" fill="none" stroke="${lightenColor(baseColor, 38)}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <!-- 散热筋 -->
  <line x1="30" y1="8" x2="30" y2="52" stroke="#1e293b" stroke-width="0.8" opacity="0.28"/>
  <line x1="45" y1="8" x2="45" y2="52" stroke="#1e293b" stroke-width="0.8" opacity="0.28"/>
  <line x1="60" y1="8" x2="60" y2="52" stroke="#1e293b" stroke-width="0.8" opacity="0.28"/>

  <!-- 前端盖 -->
  <rect x="11" y="10" width="4" height="40" rx="1" fill="url(#motorEndCapGrad)" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="12.5" y1="13" x2="12.5" y2="47" stroke="${lightenColor(baseColor, 22)}" stroke-width="0.8" opacity="0.4"/>

  <!-- 接线盒 -->
  <rect x="22" y="11" width="20" height="12" rx="1" fill="${darkenColor(baseColor, 12)}" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="24" y1="13" x2="40" y2="13" stroke="${lightenColor(baseColor, 22)}" stroke-width="0.8" opacity="0.4"/>

  <!-- 后端风扇罩 -->
  <path d="M 101 10 Q 113 30 101 50" fill="none" stroke="${darkenColor(baseColor, 15)}" stroke-width="1.5"/>
  <path d="M 102 10 Q 112 30 102 50" fill="none" stroke="${lightenColor(baseColor, 8)}" stroke-width="0.8" opacity="0.4"/>

  <!-- 风扇 -->
  <g transform="translate(86 30)">
    <g>
      <circle cx="0" cy="0" r="8" fill="#0f172a" stroke="${darkenColor(baseColor, 15)}" stroke-width="1.2"/>
      <path d="M 0 -7 C 3 -7 5 -3 2 0 C 0 -1 -1 -3 0 -7" fill="${props.isRunning ? runColor : lightenColor(baseColor, 8)}" opacity="0.9"/>
      <path d="M 7 0 C 7 3 3 5 0 2 C 1 0 3 -1 7 0" fill="${props.isRunning ? runColor : lightenColor(baseColor, 8)}" opacity="0.8"/>
      <path d="M 0 7 C -3 7 -5 3 -2 0 C 0 1 1 3 0 7" fill="${props.isRunning ? runColor : lightenColor(baseColor, 8)}" opacity="0.9"/>
      <path d="M -7 0 C -7 -3 -3 -5 0 -2 C -1 0 -3 1 -7 0" fill="${props.isRunning ? runColor : lightenColor(baseColor, 8)}" opacity="0.8"/>
      <!-- 轮毅外圈 -->
      <circle cx="0" cy="0" r="3.5" fill="${darkenColor(baseColor, 18)}" stroke="#1e293b" stroke-width="1"/>
      <!-- 轮毅内圈 -->
      <circle cx="0" cy="0" r="2" fill="${lightenColor(baseColor, 8)}" stroke="#0f172a" stroke-width="0.8"/>
      <!-- 高光 -->
      <circle cx="-0.8" cy="-0.8" r="0.8" fill="${lightenColor(baseColor, 30)}" opacity="0.6"/>
      ${props.isRunning && props.rpm > 0 ? `
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 0 0"
        to="360 0 0"
        dur="${fanDuration}"
        repeatCount="indefinite"
      />
      ` : ''}
    </g>
  </g>

  <!-- 运行指示灯 -->
  <circle cx="95" cy="19" r="3.5" fill="${props.isRunning ? runColor : darkenColor(baseColor, 10)}" stroke="#1e293b" stroke-width="1"/>
  ${props.isRunning ? `<circle cx="94.2" cy="18.2" r="1.2" fill="${lightenColor(runColor, 30)}" opacity="0.7"/>` : ''}

  <!-- 底座阴影 -->
  <rect x="18" y="54.5" width="78" height="5" rx="1" fill="${darkenColor(baseColor, 30)}" opacity="0.3"/>
  <!-- 底座 -->
  <rect x="18" y="53" width="78" height="5" rx="1" fill="${darkenColor(baseColor, 12)}" stroke="#1e293b" stroke-width="1.2"/>
  <line x1="20" y1="54.5" x2="94" y2="54.5" stroke="${lightenColor(baseColor, 18)}" stroke-width="0.8" opacity="0.4"/>

  <!-- 故障闪烁 -->
  ${props.hasError ? `
  <rect x="15" y="7" width="86" height="46" rx="3" fill="none" stroke="#ff4d4f" stroke-width="2.5" opacity="0.6">
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite"/>
  </rect>
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
    renderMotor(element, props);
    return {
      update: (nextProps: Props) => renderMotor(element, nextProps),
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
