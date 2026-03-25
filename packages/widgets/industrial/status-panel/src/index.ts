/**
 * Status Panel 组件 - 工业状态指示面板
 * 
 * 支持三种模式：
 * 1. alarm: 报警牌（呼吸灯效果）
 * 2. control: 控制面板（手动/自动 + 开关）
 * 3. indicator: 状态指示（带指示灯）
 */

import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { 
  defineWidget, 
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext 
} from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

/**
 * 状态颜色映射
 */
const STATUS_COLORS = {
  normal: '#52c41a',    // 绿色
  warning: '#faad14',   // 橙色
  error: '#ff4d4f',     // 红色
  offline: '#8c8c8c',   // 灰色
  critical: '#ff0000',  // 深红
};

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * 渲染报警牌
 */
function renderAlarmPanel(element: HTMLElement, props: Props, colors: WidgetColors) {
  const colorMap: Record<string, string> = {
    warning: STATUS_COLORS.warning,
    error: STATUS_COLORS.error,
    critical: STATUS_COLORS.critical,
  };
  
  const baseColor = props.primaryColor || colorMap[props.alarmLevel] || STATUS_COLORS.error;
  const uuid = generateId();
  const gradientId = `alarmGrad-${uuid}`;
  
  // 呼吸动画 CSS
  const animStyle = props.flashing ? `
    <style>
      @keyframes breathe-${uuid} {
        0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 3px ${baseColor}); }
        50% { opacity: 1; filter: drop-shadow(0 0 12px ${baseColor}); }
      }
      .alarm-panel-${uuid} {
        animation: breathe-${uuid} ${props.flashSpeed}s ease-in-out infinite;
      }
    </style>
  ` : '';
  
  element.innerHTML = `
    ${animStyle}
    <div class="alarm-panel-${uuid}" style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${props.backgroundColor};
      border: 2px solid ${baseColor};
      border-radius: ${props.borderRadius}px;
      padding: ${props.padding}px;
      box-sizing: border-box;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" style="margin-right: 8px; flex-shrink: 0;">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${baseColor}"/>
            <stop offset="100%" stop-color="${baseColor}"/>
          </linearGradient>
        </defs>
        <path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20h-13L12 5.5z" fill="url(#${gradientId})"/>
        <path d="M11 10h2v6h-2zM11 17h2v2h-2z" fill="${props.backgroundColor}"/>
      </svg>
      <span style="
        color: ${baseColor};
        font-size: ${props.fontSize}px;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">${props.alarmText}</span>
    </div>
  `;
}

/**
 * 渲染控制面板
 */
function renderControlPanel(element: HTMLElement, props: Props, colors: WidgetColors) {
  const fgColor = colors.fg;
  const accentColor = props.primaryColor || '#0ea5e9';
  const isOn = props.switchState === 'on';
  const isManual = props.mode === 'manual';
  
  // 手动/自动切换按钮
  const modeSection = props.showModeSwitch ? `
    <div style="
      display: flex;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      padding: 2px;
      margin-bottom: ${props.layout === 'vertical' ? '8px' : '0'};
      margin-right: ${props.layout === 'horizontal' ? '12px' : '0'};
    ">
      <div style="
        padding: 4px 12px;
        border-radius: 3px;
        font-size: ${props.fontSize - 2}px;
        background: ${isManual ? accentColor : 'transparent'};
        color: ${isManual ? '#fff' : fgColor};
        transition: all 0.3s;
      ">手动</div>
      <div style="
        padding: 4px 12px;
        border-radius: 3px;
        font-size: ${props.fontSize - 2}px;
        background: ${!isManual ? accentColor : 'transparent'};
        color: ${!isManual ? '#fff' : fgColor};
        transition: all 0.3s;
      ">自动</div>
    </div>
  ` : '';
  
  // 开关按钮
  const switchSection = props.showSwitch ? `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <div style="
        width: 48px;
        height: 24px;
        background: ${isOn ? accentColor : '#333'};
        border-radius: 12px;
        position: relative;
        transition: all 0.3s;
        box-shadow: ${isOn ? `0 0 8px ${accentColor}` : 'none'};
      ">
        <div style="
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: ${isOn ? '26px' : '2px'};
          transition: all 0.3s;
        "></div>
      </div>
      <span style="
        font-size: ${props.fontSize}px;
        color: ${isOn ? accentColor : fgColor};
        font-weight: ${isOn ? 'bold' : 'normal'};
      ">${isOn ? '开' : '关'}</span>
    </div>
  ` : '';
  
  element.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: ${props.layout};
      align-items: ${props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center'};
      justify-content: center;
      background: ${props.backgroundColor};
      border: 1px solid ${props.borderColor || 'rgba(255,255,255,0.1)'};
      border-radius: ${props.borderRadius}px;
      padding: ${props.padding}px;
      box-sizing: border-box;
    ">
      <div style="
        font-size: ${props.fontSize}px;
        color: ${fgColor};
        margin-bottom: ${props.layout === 'vertical' ? '8px' : '0'};
        margin-right: ${props.layout === 'horizontal' ? '12px' : '0'};
        font-weight: 500;
        white-space: nowrap;
      ">${props.title}</div>
      ${modeSection}
      ${switchSection}
    </div>
  `;
}

/**
 * 渲染状态指示器
 */
function renderIndicator(element: HTMLElement, props: Props, colors: WidgetColors) {
  const statusColor = STATUS_COLORS[props.status] || STATUS_COLORS.normal;
  const displayColor = props.primaryColor || statusColor;
  const fgColor = colors.fg;
  
  // 指示灯
  const light = props.showLight ? `
    <div style="
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${displayColor};
      box-shadow: 0 0 8px ${displayColor};
      margin-right: 8px;
      flex-shrink: 0;
      animation: ${props.status === 'warning' || props.status === 'error' ? 'pulse 1.5s ease-in-out infinite' : 'none'};
    "></div>
  ` : '';
  
  element.innerHTML = `
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: ${props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center'};
      background: ${props.backgroundColor};
      border: 1px solid ${props.borderColor || 'rgba(255,255,255,0.1)'};
      border-radius: ${props.borderRadius}px;
      padding: ${props.padding}px;
      box-sizing: border-box;
    ">
      ${light}
      <div style="
        display: flex;
        flex-direction: ${props.layout === 'vertical' ? 'column' : 'row'};
        align-items: center;
        gap: ${props.layout === 'vertical' ? '4px' : '8px'};
      ">
        <span style="
          font-size: ${props.fontSize}px;
          color: ${fgColor};
          font-weight: 500;
          white-space: nowrap;
        ">${props.title}</span>
        <span style="
          font-size: ${props.fontSize}px;
          color: ${displayColor};
          font-weight: bold;
          white-space: nowrap;
        ">${props.statusText}</span>
      </div>
    </div>
  `;
}

/**
 * 主渲染函数
 */
function renderPanel(element: HTMLElement, props: Props, colors: WidgetColors) {
  switch (props.type) {
    case 'alarm':
      renderAlarmPanel(element, props, colors);
      break;
    case 'control':
      renderControlPanel(element, props, colors);
      break;
    case 'indicator':
    default:
      renderIndicator(element, props, colors);
      break;
  }
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    element.style.width = '100%';
    element.style.height = '100%';
    element.dataset.thingsvisOverlay = 'industrial-status-panel';
    
    let currentProps = props;
    let currentCtx = ctx;
    let colors = resolveWidgetColors(element);
    
    // 初始渲染
    renderPanel(element, currentProps, colors);
    
    // 监听主题变化
    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      });
      themeObserver.observe(themeTarget, { 
        attributes: true, 
        attributeFilter: ['data-canvas-theme'] 
      });
    }
    
    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        currentCtx = nextCtx;
        colors = resolveWidgetColors(element);
        renderPanel(element, currentProps, colors);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
