/**
 * Text widget props schema
 *
 * Built with @thingsvis/widget-sdk
 *
 * Property groups:
 * - Content: text (data-bindable)
 * - Font: fontSize, fontFamily, fontWeight, fontStyle
 * - Layout: textAlign, lineHeight, letterSpacing
 * - Color: fill, backgroundColor
 * - Effects: opacity, textShadow
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // Content
  // ========================================

  /** Text content */
  text: z.string().default('Text').describe('props.textContent'),

  // ========================================
  // Font
  // ========================================

  /** Font size (px) */
  fontSize: z.number().min(8).max(200).default(16).describe('props.fontSize'),

  /** Font family */
  fontFamily: z.enum([
    'sans-serif',
    'serif',
    'monospace',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Microsoft YaHei',
    'PingFang SC',
    'SimHei',
    'SimSun',
  ]).default('sans-serif').describe('props.fontFamily'),

  /** Font weight */
  fontWeight: z.enum(['normal', 'bold', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900']).default('normal').describe('props.fontWeight'),

  /** Font style (italic) */
  fontStyle: z.enum(['normal', 'italic', 'oblique']).default('normal').describe('props.fontStyle'),

  // ========================================
  // Layout
  // ========================================

  /** Text align */
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left').describe('props.textAlign'),

  /** Vertical align */
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('top').describe('props.alignVertical'),

  /** Line height */
  lineHeight: z.number().min(0.5).max(5).default(1.4).describe('props.lineHeight'),

  /** Letter spacing */
  letterSpacing: z.number().min(-10).max(50).default(0).describe('props.letterSpacing'),

  /** Text decoration */
  textDecoration: z.enum(['none', 'underline', 'line-through']).default('none').describe('props.textDecoration'),

  // ========================================
  // Color
  // ========================================

  /** Text color */
  fill: z.string().default('#333333').describe('props.textColor'),

  // ========================================
  // Effects
  // ========================================

  /** Opacity */
  opacity: z.number().min(0).max(1).default(1).describe('props.opacity'),

  /** Text shadow enabled */
  textShadowEnabled: z.boolean().default(false).describe('props.textShadowEnabled'),

  /** Shadow color */
  textShadowColor: z.string().default('rgba(0,0,0,0.3)').describe('props.textShadowColor'),

  /** Shadow blur */
  textShadowBlur: z.number().min(0).max(50).default(4).describe('props.textShadowBlur'),

  /** Shadow X offset */
  textShadowOffsetX: z.number().min(-50).max(50).default(1).describe('props.textShadowOffsetX'),

  /** Shadow Y offset */
  textShadowOffsetY: z.number().min(-50).max(50).default(1).describe('props.textShadowOffsetY'),
});

/** Props type */
export type Props = z.infer<typeof PropsSchema>;

/** Get default props */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
