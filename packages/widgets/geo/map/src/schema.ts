import { z } from 'zod';

export const PropsSchema = z.object({
  // 定位坐标
  lat: z.number().min(-90).max(90).default(39.9042).describe('lat'),
  lng: z.number().min(-180).max(180).default(116.4074).describe('lng'),
  // 缩放级别 (1-18)
  zoom: z.number().min(1).max(18).default(13).describe('zoom'),
  // 显示标记
  showMarker: z.boolean().default(true).describe('showMarker'),
  // 标记标题
  markerTitle: z.string().default('').describe('markerTitle'),
  // 地图样式: standard(标准), dark(暗黑), light(浅色)
  mapStyle: z.enum(['standard', 'dark', 'light']).default('standard').describe('mapStyle'),
  // 显示缩放控件
  showZoomControl: z.boolean().default(true).describe('showZoomControl'),
  // 允许交互
  interactive: z.boolean().default(true).describe('interactive'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
