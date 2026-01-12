/**
 * BasePropsSchema - 基础属性 Schema
 * 
 * 所有组件共享的基础属性（位置、尺寸、旋转等）
 * 由 Studio 自动管理，开发者无需关心
 */

import { z } from 'zod';

/**
 * 基础属性 Schema
 * 
 * 以 _ 前缀的属性由系统管理，不出现在属性面板
 */
export const BasePropsSchema = z.object({
  // ========================================
  // 系统属性（自动管理，属性面板不显示）
  // ========================================

  /** X 坐标 */
  _x: z.number().default(0),
  /** Y 坐标 */
  _y: z.number().default(0),
  /** 宽度 */
  _width: z.number().default(200),
  /** 高度 */
  _height: z.number().default(150),
  /** 旋转角度（度） */
  _rotation: z.number().default(0),
  /** 不透明度 */
  _opacity: z.number().min(0).max(1).default(1),
  /** 是否锁定 */
  _locked: z.boolean().default(false),
  /** 是否隐藏 */
  _hidden: z.boolean().default(false),
  /** 层级 */
  _zIndex: z.number().default(0),
});

/** 基础属性类型 */
export type BaseProps = z.infer<typeof BasePropsSchema>;

/**
 * 创建扩展的属性 Schema
 * 
 * @example
 * ```typescript
 * const PropsSchema = extendBaseProps({
 *   title: z.string().default('标题'),
 *   color: z.string().default('#1890ff'),
 * });
 * ```
 */
export function extendBaseProps<T extends z.ZodRawShape>(shape: T) {
  return BasePropsSchema.extend(shape);
}
