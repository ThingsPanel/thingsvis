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
  { id: 'bar',           category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '竖条标题', en: 'Bar Title' } },
  { id: 'chevron',       category: 'section-title', animated: false, defaultSize: { width: 500, height: 32 }, description: { zh: '双箭头标题', en: 'Chevron Title' } },
  { id: 'slash',         category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '斜切标题栏', en: 'Slash Tab' } },
  { id: 'trapezoid',     category: 'section-title', animated: false, defaultSize: { width: 500, height: 38 }, description: { zh: '梯形标签', en: 'Trapezoid Tab' } },
  { id: 'arc-dip',       category: 'section-title', animated: false, defaultSize: { width: 500, height: 36 }, description: { zh: '凹陷弧线', en: 'Arc Dip' } },
  { id: 'circuit-line',  category: 'section-title', animated: true,  defaultSize: { width: 500, height: 36 }, description: { zh: '电路装饰线', en: 'Circuit Line' } },
  { id: 'triple-segment',category: 'section-title', animated: true,  defaultSize: { width: 500, height: 14 }, description: { zh: '三段递进', en: 'Triple Segment' } },

  // ==================== 大屏主标题 ====================
  { id: 'diamond-bar',    category: 'main-header', animated: true,  defaultSize: { width: 900, height: 60 }, description: { zh: '顶部凸起标题框', en: 'Diamond Bar' } },
  { id: 'sleek',         category: 'main-header', animated: false, defaultSize: { width: 900, height: 50 }, description: { zh: '简约科技主标题', en: 'Sleek Header' } },
  { id: 'diamond-crown', category: 'main-header', animated: false, defaultSize: { width: 900, height: 56 }, description: { zh: '宝石冠形主标题', en: 'Diamond Crown' } },
  { id: 'aurora',        category: 'main-header', animated: true,  defaultSize: { width: 900, height: 56 }, description: { zh: '紫金极光渐变主标题', en: 'Aurora Gradient' } },
  { id: 'wing-arrow',    category: 'main-header', animated: false, defaultSize: { width: 900, height: 58 }, description: { zh: '翼箭主标题', en: 'Wing Arrow' } },
  { id: 'bold-shield',   category: 'main-header', animated: true,  defaultSize: { width: 900, height: 50 }, description: { zh: '粗线盾形主标题', en: 'Bold Shield' } },
  { id: 'bracket-frame', category: 'main-header', animated: true,  defaultSize: { width: 900, height: 54 }, description: { zh: '双括号主标题', en: 'Double Bracket' } },
  { id: 'nav-tab',       category: 'main-header', animated: false, defaultSize: { width: 900, height: 66 }, description: { zh: '导航标签主标题', en: 'Nav Tab Header' } }
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
