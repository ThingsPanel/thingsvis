import { z } from 'zod';

export const PropsSchema = z.object({
  src: z.string().default('').describe('视频流地址 (WebSocket/HTTP)'),
  mode: z.string().default('webrtc,mse,hls,mjpeg').describe('支持的流模式'),
  background: z.boolean().default(false).describe('后台运行'),
  visibilityThreshold: z.number().min(0).max(1).default(0).describe('可见度阈值'),

  // 样式相关
  objectFit: z.enum(['contain', 'cover', 'fill', 'none']).default('contain').describe('视频自适应模式'),
  borderWidth: z.number().min(0).default(0).describe('边框宽度'),
  borderColor: z.string().default('#000000').describe('边框颜色'),
  borderRadius: z.number().min(0).default(0).describe('圆角半径'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
