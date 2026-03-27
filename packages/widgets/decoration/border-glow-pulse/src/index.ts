import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderBorderGlowPulse(props: Props, uuid: string): string {
  const animStyle = props.animated ? `
    <style>
      @keyframes pulse-${uuid} {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .anim-glow-${uuid} {
        animation: pulse-${uuid} ${props.animationSpeed}s ease-in-out infinite;
      }
    </style>` : '';
    
  const animClass = props.animated ? `class="anim-glow-${uuid}"` : '';

  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <defs>
        <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect x="3" y="3" width="94" height="94" fill="none" stroke="${props.color}" stroke-width="1.5"
        rx="4" filter="url(#glow-${uuid})" ${animClass} />
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
    container.innerHTML = renderBorderGlowPulse(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderBorderGlowPulse(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
