/**
 * Status Panel 组件 Props Schema
 * 
 * 工业状态指示面板：报警牌 / 控制面板 / 状态指示
 */

import { z } from 'zod';

export const PropsSchema = z.object({
  // ========================================
  // 基础配置
  // ========================================
  
  /** 面板类型 */
  type: z.enum(['alarm', 'control', 'indicator']).default('indicator'),
  
  /** 标题 */
  title: z.string().default('设备').describe('props.title'),
  
  // ========================================
  // 报警模式配置 (type='alarm')
  // ========================================
  
  /** 报警文本 */
  alarmText: z.string().default('故障').describe('props.alarmText'),
  
  /** 报警级别 */
  alarmLevel: z.enum(['warning', 'error', 'critical']).default('error').describe('props.alarmLevel'),
  
  /** 是否闪烁 */
  flashing: z.boolean().default(true).describe('props.flashing'),
  
  /** 闪烁速度 (秒) */
  flashSpeed: z.number().min(0.5).max(5).default(1).describe('props.flashSpeed'),
  
  // ========================================
  // 控制模式配置 (type='control')
  // ========================================
  
  /** 当前模式 */
  mode: z.enum(['manual', 'auto']).default('manual').describe('props.mode'),
  
  /** 开关状态 */
  switchState: z.enum(['on', 'off']).default('off').describe('props.switchState'),
  
  /** 显示模式切换 */
  showModeSwitch: z.boolean().default(true).describe('props.showModeSwitch'),
  
  /** 显示开关 */
  showSwitch: z.boolean().default(true).describe('props.showSwitch'),
  
  // ========================================
  // 指示器模式配置 (type='indicator')
  // ========================================
  
  /** 状态 */
  status: z.enum(['normal', 'warning', 'error', 'offline']).default('normal').describe('props.status'),
  
  /** 状态文本 */
  statusText: z.string().default('正常').describe('props.statusText'),
  
  /** 是否显示指示灯 */
  showLight: z.boolean().default(true).describe('props.showLight'),
  
  // ========================================
  // 样式配置
  // ========================================
  
  /** 主题色 */
  primaryColor: z.string().default('').describe('props.primaryColor'),
  
  /** 背景色 */
  backgroundColor: z.string().default('rgba(0,0,0,0.4)').describe('props.backgroundColor'),
  
  /** 边框色 */
  borderColor: z.string().default('').describe('props.borderColor'),
  
  /** 圆角 */
  borderRadius: z.number().min(0).max(20).default(4).describe('props.borderRadius'),
  
  /** 内边距 */
  padding: z.number().min(0).max(20).default(10).describe('props.padding'),
  
  /** 字体大小 */
  fontSize: z.number().min(10).max(32).default(14).describe('props.fontSize'),
  
  // ========================================
  // 布局
  // ========================================
  
  /** 布局方向 */
  layout: z.enum(['horizontal', 'vertical']).default('vertical').describe('props.layout'),
  
  /** 对齐方式 */
  align: z.enum(['left', 'center', 'right']).default('center').describe('props.align'),
});

/** Props 类型 */
export type Props = z.infer<typeof PropsSchema>;

/** 获取默认 Props */
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
