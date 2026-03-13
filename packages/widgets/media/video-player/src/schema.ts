import { z } from 'zod';

export const PropsSchema = z.object({
  src: z.string().default('').describe('props.src'),
  mode: z.string().default('webrtc,mse,hls,mjpeg').describe('props.mode'),
  background: z.boolean().default(false).describe('props.background'),
  visibilityThreshold: z.number().min(0).max(1).default(0).describe('props.visibilityThreshold'),

  // Style
  objectFit: z.enum(['contain', 'cover', 'fill', 'none']).default('contain').describe('props.objectFit'),
  borderWidth: z.number().min(0).default(0).describe('props.borderWidth'),
  borderColor: z.string().default('#000000').describe('props.borderColor'),
  borderRadius: z.number().min(0).default(0).describe('props.borderRadius'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
