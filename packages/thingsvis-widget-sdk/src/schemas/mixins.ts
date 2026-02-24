/**
 * Mixins - 可组合的属性 Schema 片段
 * 
 * 提供常用的属性组合，开发者可按需引入
 */

import { z } from 'zod';

// ============================================================================
// Transform Mixin - 变换属性
// ============================================================================

export const TransformMixin = {
  /** 缩放 X */
  scaleX: z.number().default(1),
  /** 缩放 Y */
  scaleY: z.number().default(1),
  /** 倾斜 X */
  skewX: z.number().default(0),
  /** 倾斜 Y */
  skewY: z.number().default(0),
  /** 锚点 X (0-1) */
  anchorX: z.number().min(0).max(1).default(0.5),
  /** 锚点 Y (0-1) */
  anchorY: z.number().min(0).max(1).default(0.5),
};

// ============================================================================
// Shadow Mixin - 阴影属性
// ============================================================================

export const ShadowMixin = {
  /** 是否启用阴影 */
  shadowEnabled: z.boolean().default(false),
  /** 阴影颜色 */
  shadowColor: z.string().default('rgba(0,0,0,0.2)'),
  /** 阴影模糊半径 */
  shadowBlur: z.number().min(0).default(10),
  /** 阴影 X 偏移 */
  shadowOffsetX: z.number().default(0),
  /** 阴影 Y 偏移 */
  shadowOffsetY: z.number().default(4),
};

// ============================================================================
// Border Mixin - 边框属性
// ============================================================================

export const BorderMixin = {
  /** 边框宽度 */
  borderWidth: z.number().min(0).default(0),
  /** 边框颜色 */
  borderColor: z.string().default('#000000'),
  /** 边框样式 */
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).default('solid'),
  /** 圆角 */
  borderRadius: z.number().min(0).default(0),
};

// ============================================================================
// Background Mixin - 背景属性
// ============================================================================

export const BackgroundMixin = {
  /** 背景色 */
  backgroundColor: z.string().default('transparent'),
  /** 背景图片 */
  backgroundImage: z.string().optional(),
  /** 背景尺寸 */
  backgroundSize: z.enum(['cover', 'contain', 'auto']).default('cover'),
  /** 背景位置 */
  backgroundPosition: z.string().default('center'),
};

// ============================================================================
// Text Mixin - 文本属性
// ============================================================================

export const TextMixin = {
  /** 字体大小 */
  fontSize: z.number().min(8).default(14),
  /** 字体颜色 */
  fontColor: z.string().default('#333333'),
  /** 字体粗细 */
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal'),
  /** 字体族 */
  fontFamily: z.string().default('inherit'),
  /** 文本对齐 */
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  /** 行高 */
  lineHeight: z.number().min(1).default(1.5),
};

// ============================================================================
// Animation Mixin - 动画属性
// ============================================================================

export const AnimationMixin = {
  /** 入场动画 */
  enterAnimation: z.enum(['none', 'fadeIn', 'slideIn', 'zoomIn', 'bounceIn']).default('none'),
  /** 动画时长 (ms) */
  animationDuration: z.number().min(0).default(300),
  /** 动画延迟 (ms) */
  animationDelay: z.number().min(0).default(0),
  /** 缓动函数 */
  animationEasing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).default('ease'),
};

// ============================================================================
// withMixins 辅助函数
// ============================================================================

type MixinName = 'transform' | 'shadow' | 'border' | 'background' | 'text' | 'animation';

const MixinMap: Record<MixinName, Record<string, z.ZodTypeAny>> = {
  transform: TransformMixin,
  shadow: ShadowMixin,
  border: BorderMixin,
  background: BackgroundMixin,
  text: TextMixin,
  animation: AnimationMixin,
};

/**
 * 将多个 Mixin 合并到基础 Schema
 * 
 * @example
 * ```typescript
 * const PropsSchema = withMixins(
 *   z.object({ title: z.string().default('标题') }),
 *   ['shadow', 'border']
 * );
 * ```
 */
export function withMixins<T extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  mixins: MixinName[]
): z.ZodObject<T & Record<string, z.ZodTypeAny>> {
  let result = baseSchema;

  for (const mixinName of mixins) {
    const mixin = MixinMap[mixinName];
    if (mixin) {
      result = result.extend(mixin) as unknown as z.ZodObject<T>;
    }
  }

  return result as unknown as z.ZodObject<T & Record<string, z.ZodTypeAny>>;
}
