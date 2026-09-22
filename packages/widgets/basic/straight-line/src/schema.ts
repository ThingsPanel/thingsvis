import { z } from 'zod';

export const PropsSchema = z.object({
  stroke: z.string().default('#94a3b8').describe('props.lineColor'),
  strokeWidth: z.number().min(1).max(50).default(2).describe('props.lineWidth'),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid').describe('props.lineStyle'),
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}

export function getStrokeDasharray(style: Props['strokeStyle'], width: number): string {
  if (style === 'dashed') return `${width * 3} ${width * 2}`;
  if (style === 'dotted') return `${width} ${width * 1.5}`;
  return '';
}
