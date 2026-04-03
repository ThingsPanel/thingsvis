import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { 
  defineWidget, 
  resolveWidgetColors,
  resolveLayeredColor,
  type WidgetOverlayContext 
} from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const num = parseInt(fullHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  return color;
}

function renderBorderCorner(props: Props, uuid: string, colors: ReturnType<typeof resolveWidgetColors>): string {
  // 颜色优先级：用户设置 > 主题色 > 默认 #6965db
  const primaryColor = props.useThemeColor 
    ? resolveLayeredColor({ instance: null, theme: colors.primary, fallback: '#6965db' })
    : props.color;
    
  const glow = props.useThemeColor
    ? resolveLayeredColor({ instance: null, theme: colors.primary, fallback: '#6965db' })
    : props.glowColor;

  const { lineWidth, cornerLength, glowIntensity, opacity, animated, animationSpeed } = props;
  
  // 霓虹发光滤镜 - 图2风格的多层发光
  const defs = `
    <defs>
      <filter id="neon-glow-${uuid}" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur1"/>
        <feFlood flood-color="${glow}" flood-opacity="${0.6 * glowIntensity}" result="color1"/>
        <feComposite in="color1" in2="blur1" operator="in" result="glow1"/>
        
        <feGaussianBlur stdDeviation="6" result="blur2"/>
        <feFlood flood-color="${glow}" flood-opacity="${0.3 * glowIntensity}" result="color2"/>
        <feComposite in="color2" in2="blur2" operator="in" result="glow2"/>
        
        <feMerge>
          <feMergeNode in="glow2"/>
          <feMergeNode in="glow1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  `;
  
  // 动画 - 霓虹闪烁效果
  const animStyle = animated ? `
    <style>
      @keyframes neon-pulse-${uuid} {
        0%, 100% { opacity: ${opacity}; filter: drop-shadow(0 0 4px ${withAlpha(glow, 0.8)}); }
        50% { opacity: ${opacity * 0.8}; filter: drop-shadow(0 0 8px ${withAlpha(glow, 1)}); }
      }
    </style>
  ` : '';
  
  const animClass = animated ? `style="animation: neon-pulse-${uuid} ${animationSpeed}s ease-in-out infinite"` : '';
  
  // L形角括号 - 图2 Glowing corner brackets border
  const L = cornerLength;
  const W = lineWidth;
  
  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      ${defs}
      <g filter="url(#neon-glow-${uuid})" ${animClass}>
        <!-- 左上 -->
        <path d="M ${L},0 L 0,0 L 0,${L}" 
          fill="none" stroke="${primaryColor}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- 右上 -->
        <path d="M ${100-L},0 L 100,0 L 100,${L}" 
          fill="none" stroke="${primaryColor}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- 右下 -->
        <path d="M 100,${100-L} L 100,100 L ${100-L},100" 
          fill="none" stroke="${primaryColor}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- 左下 -->
        <path d="M 0,${100-L} L 0,100 L ${L},100" 
          fill="none" stroke="${primaryColor}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
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
    
    let container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    element.appendChild(container);
    
    const uuid = generateId();
    let colors = resolveWidgetColors(element);
    
    container.innerHTML = renderBorderCorner(props, uuid, colors);
    
    // 监听主题变化
    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        container.innerHTML = renderBorderCorner(props, uuid, colors);
      });
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
    }
    
    return {
      update: (nextProps: Props) => {
        props = nextProps;
        colors = resolveWidgetColors(element);
        container.innerHTML = renderBorderCorner(props, uuid, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
