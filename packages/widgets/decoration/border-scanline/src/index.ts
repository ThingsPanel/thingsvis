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

function renderBorderScanline(props: Props, uuid: string, colors: ReturnType<typeof resolveWidgetColors>): string {
  // 颜色优先级：用户设置 > 主题色 > 默认 #6965db
  const primaryColor = props.useThemeColor 
    ? resolveLayeredColor({ instance: null, theme: colors.primary, fallback: '#6965db' })
    : props.color;
    
  const glow = props.useThemeColor
    ? resolveLayeredColor({ instance: null, theme: colors.primary, fallback: '#6965db' })
    : props.glowColor;

  const { borderWidth, glowWidth, flowLength, glowIntensity, showCornerDots, opacity, animated, animationSpeed, flowDirection } = props;
  
  const defs = `
    <defs>
      <!-- 霓虹发光滤镜 -->
      <filter id="scan-glow-${uuid}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${glowWidth * 0.5}" result="blur1"/>
        <feFlood flood-color="${glow}" flood-opacity="${0.6 * glowIntensity}" result="color1"/>
        <feComposite in="color1" in2="blur1" operator="in" result="glow1"/>
        
        <feGaussianBlur stdDeviation="${glowWidth}" result="blur2"/>
        <feFlood flood-color="${glow}" flood-opacity="${0.3 * glowIntensity}" result="color2"/>
        <feComposite in="color2" in2="blur2" operator="in" result="glow2"/>
        
        <feMerge>
          <feMergeNode in="glow2"/>
          <feMergeNode in="glow1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- 流光渐变 -->
      <linearGradient id="flow-grad-${uuid}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${withAlpha(primaryColor, 0.1)}"/>
        <stop offset="20%" stop-color="${withAlpha(primaryColor, 0.5)}"/>
        <stop offset="50%" stop-color="${primaryColor}"/>
        <stop offset="80%" stop-color="${withAlpha(primaryColor, 0.5)}"/>
        <stop offset="100%" stop-color="${withAlpha(primaryColor, 0.1)}"/>
      </linearGradient>
    </defs>
  `;
  
  // 动画
  const animStyle = animated ? `
    <style>
      @keyframes scan-flow-${uuid} {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -400; }
      }
      @keyframes corner-dot-${uuid} {
        0%, 100% { opacity: 0.4; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    </style>
  ` : '';
  
  const flowAnim = animated 
    ? `stroke-dasharray="${flowLength} ${400 - flowLength}" stroke-dashoffset="0" style="animation: scan-flow-${uuid} ${animationSpeed}s linear infinite"`
    : '';
    
  const dotAnim = animated ? `style="animation: corner-dot-${uuid} ${animationSpeed * 1.5}s ease-in-out infinite"` : '';
  
  // 四角光点 - 图2 Animated scanline border 风格
  const cornerDots = showCornerDots ? `
    <g filter="url(#scan-glow-${uuid})">
      <circle cx="0" cy="0" r="${borderWidth * 1.2}" fill="${glow}" ${dotAnim}/>
      <circle cx="100" cy="0" r="${borderWidth * 1.2}" fill="${glow}" ${dotAnim} style="animation-delay: 0.5s"/>
      <circle cx="100" cy="100" r="${borderWidth * 1.2}" fill="${glow}" ${dotAnim} style="animation-delay: 1s"/>
      <circle cx="0" cy="100" r="${borderWidth * 1.2}" fill="${glow}" ${dotAnim} style="animation-delay: 1.5s"/>
    </g>
  ` : '';
  
  return `
    ${animStyle}
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      ${defs}
      
      <!-- 底框 -->
      <rect x="${borderWidth/2}" y="${borderWidth/2}" width="${100-borderWidth}" height="${100-borderWidth}" 
        fill="none" stroke="${withAlpha(primaryColor, 0.2)}" stroke-width="${borderWidth}" rx="2"/>
      
      <!-- 流光 -->
      <rect x="${borderWidth/2}" y="${borderWidth/2}" width="${100-borderWidth}" height="${100-borderWidth}" 
        fill="none" stroke="url(#flow-grad-${uuid})" stroke-width="${borderWidth + 1}" 
        stroke-linecap="round" rx="2" filter="url(#scan-glow-${uuid})" ${flowAnim}/>
      
      <!-- 四角光点 -->
      ${cornerDots}
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
    
    container.innerHTML = renderBorderScanline(props, uuid, colors);
    
    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        container.innerHTML = renderBorderScanline(props, uuid, colors);
      });
      themeObserver.observe(themeTarget, { attributes: true, attributeFilter: ['data-canvas-theme'] });
    }
    
    return {
      update: (nextProps: Props) => {
        props = nextProps;
        colors = resolveWidgetColors(element);
        container.innerHTML = renderBorderScanline(props, uuid, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
