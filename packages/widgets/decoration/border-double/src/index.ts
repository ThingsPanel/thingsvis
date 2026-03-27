import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderBorderDouble(props: Props, uuid: string): string {
  const animStyle = props.animated ? `
    <style>
      @keyframes blink-${uuid} {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .anim-diamond-${uuid} {
        animation: blink-${uuid} ${props.animationSpeed}s ease-in-out infinite;
      }
    </style>` : '';
    
  const animClass = props.animated ? `class="anim-diamond-${uuid}"` : '';

  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <!-- 外框 -->
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="${props.secondaryColor}" stroke-width="1"/>
      
      <!-- 内框 -->
      <rect x="4" y="4" width="92" height="92" fill="none" stroke="${props.color}" stroke-width="1.5"/>
      
      <!-- 四角菱形 -->
      <g fill="${props.color}" ${animClass}>
        <!-- 左上 -->
        <polygon points="4,4 7,1 10,4 7,7" />
        <!-- 右上 -->
        <polygon points="96,4 93,1 90,4 93,7" />
        <!-- 右下 -->
        <polygon points="96,96 93,93 90,96 93,99" />
        <!-- 左下 -->
        <polygon points="4,96 7,93 10,96 7,99" />
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
    container.innerHTML = renderBorderDouble(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderBorderDouble(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
