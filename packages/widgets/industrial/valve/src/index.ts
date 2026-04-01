import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderValve(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const bodyColor = props.hasError ? '#ff4d4f' : '#334155';
  const pipeColor = props.hasError ? '#ff7875' : '#475569';
  const discColor = props.hasError
    ? '#ff7875'
    : (props.isOpen ? props.openColor : props.closedColor);
  const flangeColor = props.hasError ? '#ff7875' : '#64748b';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 -8 100 76" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="valveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(bodyColor, 15)};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bodyColor};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 左短管 -->
  <rect x="0" y="24" width="20" height="12" fill="${pipeColor}"/>
  
  <!-- 右短管 -->
  <rect x="80" y="24" width="20" height="12" fill="${pipeColor}"/>

  <!-- 左法兰 - 紧贴阀体 -->
  <rect x="20" y="18" width="6" height="24" fill="${flangeColor}"/>
  
  <!-- 右法兰 - 紧贴阀体 -->
  <rect x="74" y="18" width="6" height="24" fill="${flangeColor}"/>

  <!-- 阀体 -->
  <circle cx="50" cy="30" r="24" fill="url(#valveGrad)" stroke="#1e293b" stroke-width="2"/>
  
  <!-- 刻度装饰线 -->
  <line x1="50" y1="10" x2="50" y2="14" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="46" x2="50" y2="50" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="30" y1="30" x2="34" y2="30" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  <line x1="66" y1="30" x2="70" y2="30" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
  
  <!-- 对角刻度线 -->
  <line x1="36" y1="16" x2="39" y2="19" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="64" y1="16" x2="61" y2="19" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="36" y1="44" x2="39" y2="41" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="64" y1="44" x2="61" y2="41" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>

  <!-- 阀芯 -->
  <circle cx="50" cy="30" r="12" fill="${discColor}" stroke="#1e293b" stroke-width="2"/>
  
  <!-- 阀芯高光 -->
  <circle cx="47" cy="27" r="3" fill="#e0f2fe" opacity="0.5"/>

  <!-- 阀杆底座 -->
  <rect x="45" y="6" width="10" height="6" rx="1" fill="#64748b" stroke="#1e293b" stroke-width="2"/>

  <!-- 阀杆 -->
  <rect x="48" y="-2" width="4" height="8" fill="#94a3b8" stroke="#1e293b" stroke-width="1.5"/>

  <!-- 手轮横杆 -->
  <rect x="38" y="-4" width="24" height="4" rx="2" fill="#94a3b8" stroke="#1e293b" stroke-width="1.5"/>
  
  <!-- 手轮中心圆 -->
  <circle cx="50" cy="-2" r="4" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.5"/>

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
