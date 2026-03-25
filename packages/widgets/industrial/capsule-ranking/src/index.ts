/**
 * Capsule Ranking 组件 - 胶囊排行榜
 * 
 * 水平胶囊条形图，支持：
 * - 自动排序
 * - 排名颜色（前三名特殊颜色）
 * - 动画效果
 * - 数据绑定
 */

import { metadata } from './metadata';
import { PropsSchema, type Props, type DataItem } from './schema';
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
 * 生成唯一 ID
 */
function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * 获取排名颜色
 */
function getRankColor(index: number, props: Props, colors: WidgetColors): string {
  if (index === 0) return props.top1Color;
  if (index === 1) return props.top2Color;
  if (index === 2) return props.top3Color;
  
  if (props.otherRankColor) return props.otherRankColor;
  
  // 使用胶囊颜色数组循环
  const colorIndex = index % props.capsuleColors.length;
  return props.capsuleColors[colorIndex] ?? colors.primary;
}

/**
 * 排序数据
 */
function sortData(data: DataItem[], sortBy: Props['sortBy'], sortOrder: Props['sortOrder']): DataItem[] {
  if (sortBy === 'none') return [...data];
  
  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'value') {
      return a.value - b.value;
    }
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  
  return sortOrder === 'desc' ? sorted.reverse() : sorted;
}

/**
 * 计算最大值
 */
function calculateMaxValue(data: DataItem[], maxValue: number): number {
  if (maxValue > 0) return maxValue;
  if (data.length === 0) return 100;
  return Math.max(...data.map(d => d.value));
}

/**
 * 生成渐变色
 */
function generateGradient(color: string): string {
  // 简单的渐变生成，从原色到稍暗的版本
  return `linear-gradient(90deg, ${color}, ${adjustBrightness(color, -20)})`;
}

/**
 * 调整颜色亮度
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * 渲染胶囊排行榜
 */
function renderRanking(element: HTMLElement, props: Props, colors: WidgetColors, uuid: string) {
  const sortedData = sortData(props.data, props.sortBy, props.sortOrder);
  const maxValue = calculateMaxValue(sortedData, props.maxValue);
  
  const fgColor = resolveLayeredColor({
    instance: props.textColor,
    theme: colors.fg,
    fallback: colors.fg,
  });
  
  const valColor = resolveLayeredColor({
    instance: props.valueColor,
    theme: colors.fg,
    fallback: colors.fg,
  });
  
  // 生成 CSS
  const animStyle = props.animated ? `
    <style>
      @keyframes capsule-fill-${uuid} {
        from { width: 0; }
      }
      @keyframes item-slide-${uuid} {
        from { 
          opacity: 0; 
          transform: translateX(-10px); 
        }
      }
      .capsule-item-${uuid} {
        animation: item-slide-${uuid} ${props.animationDuration}s ease-out;
        animation-fill-mode: backwards;
      }
      .capsule-fill-${uuid} {
        animation: capsule-fill-${uuid} ${props.animationDuration}s ease-out;
        animation-fill-mode: backwards;
      }
    </style>
  ` : '';
  
  // 生成行
  const rows = sortedData.map((item, index) => {
    const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
    const rankColor = getRankColor(index, props, colors);
    const fillStyle = props.gradientEnabled ? generateGradient(rankColor) : rankColor;
    const delay = index * 0.1;
    
    return `
      <div class="capsule-item-${uuid}" style="
        display: flex;
        align-items: center;
        height: ${props.rowHeight}px;
        gap: 8px;
        ${props.animated ? `animation-delay: ${delay}s;` : ''}
      ">
        ${props.showRank ? `
          <div style="
            width: 24px;
            text-align: center;
            font-size: ${props.fontSize}px;
            font-weight: bold;
            color: ${rankColor};
            flex-shrink: 0;
          ">${index + 1}</div>
        ` : ''}
        
        ${props.showName ? `
          <div style="
            width: ${props.labelWidth}px;
            font-size: ${props.fontSize}px;
            color: ${fgColor};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0;
          ">${item.name}</div>
        ` : '<div style="flex-shrink:0;"></div>'}
        
        <!-- 胶囊轨道 -->
        <div style="
          flex: 1;
          height: ${props.capsuleHeight}px;
          background: ${props.trackColor};
          border-radius: ${props.capsuleRadius}px;
          overflow: hidden;
          min-width: 40px;
        ">
          <div class="capsule-fill-${uuid}" style="
            height: 100%;
            width: ${percent}%;
            background: ${fillStyle};
            border-radius: ${props.capsuleRadius}px;
            ${props.animated ? `animation-delay: ${delay + 0.1}s;` : ''}
            transition: ${props.animated ? '' : 'width 0.3s ease'};
          "></div>
        </div>
        
        ${props.showValue ? `
          <div style="
            font-size: ${props.fontSize}px;
            color: ${valColor};
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
            min-width: 40px;
            text-align: right;
          ">
            ${item.value}${props.showUnit && item.unit ? item.unit : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  element.innerHTML = `
    ${animStyle}
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
    ">
      ${props.title ? `
        <div style="
          font-size: ${props.fontSize + 2}px;
          font-weight: bold;
          color: ${fgColor};
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        ">${props.title}</div>
      ` : ''}
      
      <div style="
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: ${props.rowGap}px;
      ">
        ${rows}
      </div>
    </div>
  `;
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
    element.dataset.thingsvisOverlay = 'industrial-capsule-ranking';
    
    const uuid = generateId();
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    
    // 初始渲染
    renderRanking(element, currentProps, colors, uuid);
    
    // 监听主题变化
    let themeObserver: MutationObserver | null = null;
    const themeTarget = element.closest('[data-canvas-theme]');
    if (themeTarget && typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        colors = resolveWidgetColors(element);
        renderRanking(element, currentProps, colors, uuid);
      });
      themeObserver.observe(themeTarget, { 
        attributes: true, 
        attributeFilter: ['data-canvas-theme'] 
      });
    }
    
    return {
      update: (nextProps: Props, nextCtx: WidgetOverlayContext) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderRanking(element, currentProps, colors, uuid);
      },
      destroy: () => {
        themeObserver?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
