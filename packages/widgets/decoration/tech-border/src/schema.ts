/**
 * Tech Border 组件 Props Schema
 * 
 * 科技风格边框装饰，支持发光、动画效果
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 基础配置
  // ========================================
  
  /** 边框变体 */
  variant: z.enum(['corner-cut', 'tech-lines', 'glow', 'simple']).default('corner-cut'),
  
  /** 边框颜色 */
  borderColor: z.string().default('#0ea5e9').describe('props.borderColor'),
  
  /** 边框宽度 */
  borderWidth: z.number().min(1).max(10).default(2).describe('props.borderWidth'),
  contentPadding: z.number().min(0).max(40).default(12).describe('props.contentPadding'),
  backgroundColor: z.string().default('transparent').describe('props.backgroundColor'),
  
  // ========================================
  // 发光效果
  // ========================================
  
  /** 启用发光 */
  glowEnabled: z.boolean().default(true).describe('props.glowEnabled'),
  
  /** 发光颜色 */
  glowColor: z.string().default('').describe('props.glowColor'),
  
  /** 发光模糊半径 */
  glowBlur: z.number().min(0).max(50).default(8).describe('props.glowBlur'),
  
  /** 发光扩散 */
  glowSpread: z.number().min(0).max(20).default(2).describe('props.glowSpread'),
  
  // ========================================
  // 装饰配置
  // ========================================
  
  /** 斜角大小 */
  cornerSize: z.number().min(0).max(50).default(15).describe('props.cornerSize'),
  
  /** 显示四角装饰 */
  showCornerDecoration: z.boolean().default(true).describe('props.showCornerDecoration'),
  
  /** 装饰线长度 */
  decorationLength: z.number().min(5).max(100).default(30).describe('props.decorationLength'),
  
  /** 装饰线宽度 */
  decorationWidth: z.number().min(1).max(10).default(3).describe('props.decorationWidth'),
  
  // ========================================
  // 动画配置
  // ========================================
  
  /** 启用流动动画 */
  animated: z.boolean().default(false).describe('props.animated'),
  
  /** 动画速度 (秒) */
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),
  
  /** 动画方向 */
  animationDirection: z.enum(['clockwise', 'counter-clockwise']).default('clockwise').describe('props.animationDirection'),
  
  // ========================================
  // 渐变配置
  // ========================================
  
  /** 启用渐变 */
  gradientEnabled: z.boolean().default(true).describe('props.gradientEnabled'),
  
  /** 渐变开始色 */
  gradientStart: z.string().default('#0ea5e9').describe('props.gradientStart'),
  
  /** 渐变结束色 */
  gradientEnd: z.string().default('#06b6d4').describe('props.gradientEnd'),
  
  /** 渐变角度 */
  gradientAngle: z.number().min(0).max(360).default(45).describe('props.gradientAngle'),
});

/** Props 类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取默认 Props */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
