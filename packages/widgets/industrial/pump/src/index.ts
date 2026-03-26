import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function renderPump(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const uuid = Math.random().toString(36).slice(2, 9);
  const pipeGradId = `pipeGrad-${uuid}`;
  const shellGradId = `shellGrad-${uuid}`;

  // Alert-state color palette.
  const currentBaseColor = props.hasError ? '#ff4d4f' : (props.baseColor || '#334155');
  const borderColor = props.hasError ? '#ff7875' : '#0ea5e9'; // sky-500
  const pipeColor = '#64748b'; // slate-500
  const fanColor = props.hasError ? '#ff7875' : '#0ea5e9';
  // RPM is rotations per minute, so one turn takes 60 / rpm seconds.
  // Clamp the duration to avoid unrealistic animation speeds that browsers may drop.
  const durSec = props.rpm > 0 ? Math.max(60 / props.rpm, 0.05).toFixed(3) : '1';

  element.innerHTML = `
<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${pipeGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(pipeColor, 15)}" />
      <stop offset="50%" style="stop-color:${pipeColor}" />
      <stop offset="100%" style="stop-color:${darkenColor(pipeColor, 15)}" />
    </linearGradient>
    <linearGradient id="${shellGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(currentBaseColor, 10)}" />
      <stop offset="100%" style="stop-color:${currentBaseColor}" />
    </linearGradient>
  </defs>
  
  <!-- Inlet pipe -->
  <rect x="5" y="42" width="20" height="16" fill="url(#${pipeGradId})" stroke="#475569" stroke-width="1"/>
  
  <!-- Outlet pipe -->
  <rect x="75" y="42" width="20" height="16" fill="url(#${pipeGradId})" stroke="#475569" stroke-width="1"/>
  
  <!-- Pump housing -->
  <circle cx="50" cy="50" r="28" fill="url(#${shellGradId})" stroke="${borderColor}" stroke-width="2"/>
  
  <!-- Inner shell -->
  <circle cx="50" cy="50" r="22" fill="#1e293b" stroke="${borderColor}" stroke-width="1" opacity="0.5"/>
  
  <!-- Impeller -->
  <g>
    <!-- Four curved blades -->
    <path d="M 50 50 L 50 28 Q 65 35 50 50" fill="${fanColor}" opacity="0.9"/>
    <path d="M 50 50 L 72 50 Q 65 65 50 50" fill="${fanColor}" opacity="0.8"/>
    <path d="M 50 50 L 50 72 Q 35 65 50 50" fill="${fanColor}" opacity="0.9"/>
    <path d="M 50 50 L 28 50 Q 35 35 50 50" fill="${fanColor}" opacity="0.8"/>
    <!-- Center hub -->
    <circle cx="50" cy="50" r="5" fill="#1e293b" stroke="${borderColor}" stroke-width="1"/>
    
    <!-- Native SVG spin animation -->
    ${props.isRunning && props.rpm > 0 ? `
    <animateTransform 
      attributeName="transform" 
      type="rotate" 
      from="0 50 50" 
      to="360 50 50" 
      dur="${durSec}s" 
      repeatCount="indefinite"
    />
    ` : ''}
  </g>
  
  <!-- Fault pulse -->
  ${props.hasError ? `
  <circle cx="50" cy="50" r="28" fill="none" stroke="#ff4d4f" stroke-width="3" opacity="0.6">
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
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: { width: 100, height: 100 },
  constraints: { minWidth: 50, minHeight: 50 },
  resizable: true,
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
