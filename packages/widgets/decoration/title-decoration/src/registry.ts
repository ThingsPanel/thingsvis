/**
 * 标题装饰组件 - 变体注册表
 *
 * 统一管理 title-decoration 的所有变体定义
 */

import type { Props } from './schema';

export interface VariantDef {
  id: string;
  category: 'main-header' | 'section-title';
  animated: boolean;
  defaultSize: { width: number; height: number };
  description: { zh: string; en: string };
}

export const VARIANT_DEFS: VariantDef[] = [
  // ==================== 区域标题栏 ====================
  // --- 新增 v4 设计 (S1-S17 → line-bar-1~9 / skew-bar / center-band / stripe-overlay) ---
  { id: 'line-bar-1',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '左缘高光条 + 标题下短渐变线', en: 'Left Accent Bar' } },
  { id: 'line-bar-2',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '斜切填充标签', en: 'Slash Fill Tag' } },
  { id: 'line-bar-3',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '横线中点光晕', en: 'Midpoint Glow' } },
  { id: 'line-bar-4',   category: 'section-title', animated: true,  defaultSize: { width: 500, height: 36 }, description: { zh: '扫描线标签', en: 'Scan Bar' } },
  { id: 'line-bar-5',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 40 }, description: { zh: '左实右透通栏渐变', en: 'Fade Bar' } },
  { id: 'line-bar-6',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 34 }, description: { zh: '连续渐变轨 + 末端小三角', en: 'Line Arrow' } },
  { id: 'line-bar-8',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 34 }, description: { zh: '「//」前缀 + 细线延伸', en: 'Comment Prefix Bar' } },
  { id: 'line-bar-9',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 34 }, description: { zh: '三点节奏 + 渐隐线', en: 'Dot Trail Bar' } },
  { id: 'line-bar-10',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '半透明竖渐变 + 底部发光', en: 'Bottom Glow Bar' } },
  { id: 'line-bar-11',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '渐变背景梯形', en: 'Gradient Trapezoid' } },
  { id: 'line-bar-12',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '双划线居中标题', en: 'Double Line Center' } },
  { id: 'line-bar-13',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '渐变条 + L 角标', en: 'L-Corner Bar' } },
  { id: 'line-bar-16',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '小方标 + 左→右渐隐长条', en: 'Icon Fade Band' } },
  { id: 'skew-bar',     category: 'section-title', animated: false, defaultSize: { width: 500, height: 40 }, description: { zh: '斜切渐变条 + 三道斜线', en: 'Skew Bar' } },
  { id: 'center-band',  category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '中间亮横向渐变带', en: 'Center Band' } },
  { id: 'stripe-overlay',category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '斜纹叠层半透明底', en: 'Stripe Overlay' } },
  // --- 原有变体 ---
  { id: 'trapezoid',     category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '梯形标签', en: 'Trapezoid Tab' } },
  { id: 'glow-beam',     category: 'section-title', animated: false, defaultSize: { width: 500, height: 32 }, description: { zh: '光柱标题', en: 'Glow Beam' } },
  { id: 'arc-dip',       category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '凹陷弧线', en: 'Arc Dip' } },
  { id: 'circuit-line',  category: 'section-title', animated: true,  defaultSize: { width: 500, height: 36 }, description: { zh: '电路装饰线', en: 'Circuit Line' } },
  { id: 'zigzag-flow',   category: 'section-title', animated: true,  defaultSize: { width: 500, height: 32 }, description: { zh: '折线流光', en: 'Zigzag Flow' } },
  { id: 'sparkle-dots',  category: 'section-title', animated: true,  defaultSize: { width: 500, height: 26 }, description: { zh: '闪烁点阵', en: 'Sparkle Dots' } },
  { id: 'triple-segment',category: 'section-title', animated: true,  defaultSize: { width: 500, height: 14 }, description: { zh: '三段递进', en: 'Triple Segment' } },
  { id: 'corner-mark',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '角标标题框', en: 'Corner Mark' } },
  { id: 'center-fade',   category: 'section-title', animated: false, defaultSize: { width: 500, height: 16 }, description: { zh: '居中渐隐线', en: 'Center Fade' } },

  // ==================== 大屏主标题 ====================
  { id: 'diamond-bar',    category: 'main-header', animated: true,  defaultSize: { width: 900, height: 60 }, description: { zh: '顶部凸起标题框', en: 'Diamond Bar' } },
  { id: 'sleek',         category: 'main-header', animated: false, defaultSize: { width: 900, height: 50 }, description: { zh: '简约科技主标题', en: 'Sleek Header' } },
  { id: 'diamond-crown', category: 'main-header', animated: false, defaultSize: { width: 900, height: 56 }, description: { zh: '宝石冠形主标题', en: 'Diamond Crown' } },
  { id: 'circuit',       category: 'main-header', animated: true,  defaultSize: { width: 900, height: 56 }, description: { zh: '电路板主标题', en: 'Circuit Header' } },
  { id: 'aurora',        category: 'main-header', animated: true,  defaultSize: { width: 900, height: 56 }, description: { zh: '紫金极光渐变主标题', en: 'Aurora Gradient' } },
  { id: 'wing-arrow',    category: 'main-header', animated: false, defaultSize: { width: 900, height: 58 }, description: { zh: '翼箭主标题', en: 'Wing Arrow' } },
  { id: 'bold-shield',   category: 'main-header', animated: true,  defaultSize: { width: 900, height: 50 }, description: { zh: '粗线盾形主标题', en: 'Bold Shield' } },
  { id: 'bracket-frame', category: 'main-header', animated: true,  defaultSize: { width: 900, height: 54 }, description: { zh: '双括号主标题', en: 'Double Bracket' } },
  { id: 'nav-tab',       category: 'main-header', animated: false, defaultSize: { width: 900, height: 66 }, description: { zh: '导航标签主标题', en: 'Nav Tab Header' } },
  { id: 'cyber-matrix',  category: 'main-header', animated: true,  defaultSize: { width: 900, height: 56 }, description: { zh: '赛博矩阵主标题', en: 'Cyber Matrix' } },
]

export function getVariantDef(id: string): VariantDef | undefined {
  return VARIANT_DEFS.find(v => v.id === id);
}

export const SECTION_TITLE_VARIANTS = VARIANT_DEFS
  .filter(v => v.category === 'section-title')
  .map(v => v.id);

export const MAIN_HEADER_VARIANTS = VARIANT_DEFS
  .filter(v => v.category === 'main-header')
  .map(v => v.id);
