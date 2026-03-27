import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderDecoDivider(props: Props, uuid: string): string {
  const animStyle = props.animated ? `
    <style>
      @keyframes pulse-dv-${uuid} {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .anim-pulse-${uuid} {
        animation: pulse-dv-${uuid} ${props.animationSpeed}s ease-in-out infinite;
      }
    </style>` : '';

  const animClass = props.animated ? `class="anim-pulse-${uuid}"` : '';

  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <defs>
        <linearGradient id="dv-grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${props.color}" stop-opacity="0"/>
          <stop offset="30%" stop-color="${props.color}" stop-opacity="1"/>
          <stop offset="70%" stop-color="${props.color}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${props.color}" stop-opacity="0"/>
        </linearGradient>
        <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g ${animClass}>
        <!-- 外发光宽线 -->
        <line x1="0" y1="50" x2="100" y2="50" stroke="url(#dv-grad-${uuid})" stroke-width="3" filter="url(#glow-${uuid})"/>
        <!-- 中心高亮细线 -->
        <line x1="0" y1="50" x2="100" y2="50" stroke="url(#dv-grad-${uuid})" stroke-width="1"/>
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
    container.innerHTML = renderDecoDivider(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderDecoDivider(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
