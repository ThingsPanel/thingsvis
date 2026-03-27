import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderDecoTitleBar(props: Props, uuid: string): string {
  const animStyle = props.animated ? `
    <style>
      @keyframes blink-${uuid} {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .anim-endmark-${uuid} {
        animation: blink-${uuid} ${props.animationSpeed}s step-start infinite;
      }
    </style>` : '';

  const animClass = props.animated ? `class="anim-endmark-${uuid}"` : '';

  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      <!-- 左侧竖条 -->
      <rect x="0" y="30" width="3" height="40" fill="${props.color}"/>
      
      <!-- 标题占位底线 (实际应用中标题文字会悬浮在上方) -->
      <line x1="8" y1="50" x2="60" y2="50" stroke="${props.color}" stroke-width="1.5"/>
      
      <!-- 右侧延伸线 -->
      <line x1="65" y1="50" x2="95" y2="50" stroke="${props.secondaryColor}" stroke-width="1"/>
      
      <!-- 右端闪烁标记 -->
      <rect x="96" y="45" width="4" height="10" fill="${props.color}" ${animClass}/>
      
      <!-- 斜角点缀 -->
      <polygon points="6,48 8,50 6,52" fill="${props.color}"/>
      <polygon points="60,48 62,50 60,52" fill="${props.color}"/>
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
    container.innerHTML = renderDecoTitleBar(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderDecoTitleBar(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
