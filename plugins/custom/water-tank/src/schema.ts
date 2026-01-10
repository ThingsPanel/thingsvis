import { z } from 'zod';

export const PropsSchema = z.object({
  // 水位 (0-100%)
  waterLevel: z.number().min(0).max(100).default(50).describe('水位(%)'),
  
  // 水的颜色
  waterColor: z.string().default('#00a8ff').describe('水的颜色'),
  
  // 水池背景色
  tankBackground: z.string().default('#e8e8e8').describe('水池背景'),
  
  // 水池边框颜色
  tankBorder: z.string().default('#333333').describe('边框颜色'),
  
  // 边框宽度
  borderWidth: z.number().min(0).max(20).default(3).describe('边框宽度'),
  
  // 是否显示波浪动画
  showWave: z.boolean().default(true).describe('波浪动画'),
  
  // 波浪速度
  waveSpeed: z.number().min(0.1).max(5).default(1).describe('波浪速度'),
  
  // 波浪高度
  waveHeight: z.number().min(0).max(30).default(8).describe('波浪高度'),
  
  // 是否显示水位文字
  showLabel: z.boolean().default(true).describe('显示水位'),
  
  // 文字颜色
  labelColor: z.string().default('#ffffff').describe('文字颜色'),
  
  // 透明度
  opacity: z.number().min(0).max(1).default(1).describe('透明度'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
