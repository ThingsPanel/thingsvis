import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderDecoScanbeam(props: Props, uuid: string): string {
  const anim = props.animated ? `
    <animateTransform attributeName="transform" type="translate"
      from="-50 0" to="100 0" dur="${props.animationSpeed}s" repeatCount="indefinite"/>
  ` : '';

  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <defs>
        <linearGradient id="beam-grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${props.color}" stop-opacity="0"/>
          <stop offset="40%" stop-color="${props.color}" stop-opacity="0.8"/>
          <stop offset="60%" stop-color="${props.color}" stop-opacity="1"/>
          <stop offset="80%" stop-color="${props.color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${props.color}" stop-opacity="0"/>
        </linearGradient>
        <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- 底部轨道线 -->
      <line x1="0" y1="50" x2="100" y2="50" stroke="${props.secondaryColor}" stroke-width="0.5" opacity="0.5"/>
      
      <!-- 扫描光束 -->
      <g filter="url(#glow-${uuid})">
        <rect x="0" y="47" width="50" height="6" fill="url(#beam-grad-${uuid})">
          ${anim}
        </rect>
      </g>
    </svg>
  `;
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    element.style.width = '100%';
    element.style.height = '100%';
    element.dataset.thingsvisOverlay = metadata.id;
    
    // Create container
    let container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.boxSizing = 'border-box';
    element.appendChild(container);
    
    const uuid = generateId();
    container.innerHTML = renderDecoScanbeam(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderDecoScanbeam(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
