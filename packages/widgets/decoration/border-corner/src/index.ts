import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderBorderCorner(props: Props, uuid: string): string {
  const animStyle = props.animated ? `
    <style>
      @keyframes pulse-${uuid} {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    </style>` : '';
    
  const animProp = props.animated ? `style="animation: pulse-${uuid} ${props.animationSpeed}s ease-in-out infinite"` : '';

  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <defs>
        <filter id="glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g stroke="${props.color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-${uuid})" ${animProp}>
        <!-- 左上 -->
        <path d="M 0,20 L 0,0 L 20,0" />
        <!-- 右上 -->
        <path d="M 80,0 L 100,0 L 100,20" />
        <!-- 右下 -->
        <path d="M 100,80 L 100,100 L 80,100" />
        <!-- 左下 -->
        <path d="M 20,100 L 0,100 L 0,80" />
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
    container.innerHTML = renderBorderCorner(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderBorderCorner(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
