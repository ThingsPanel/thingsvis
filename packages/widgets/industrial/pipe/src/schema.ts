import { z } from 'zod';

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PropsSchema = z.object({
  points: z
    .array(PointSchema)
    .default([
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ]),
  stroke: z.string().default('#2563eb'),
  strokeWidth: z.number().min(1).max(50).default(4),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  opacity: z.number().min(0).max(1).default(1),
  lineCap: z.enum(['butt', 'round', 'square']).default('square'),
  pipeBackground: z.string().default('#0f172a'), // slate-900 工业深色管壁
  pipeInnerColor: z.string().default('#1e293b'), // slate-800 工业深色管芯
  flowEnabled: z.boolean().default(false),
  glowEffect: z.boolean().default(true),
  glowColor: z.string().default('#38bdf8'), // sky-400 默认科技蓝发光
  flowDirection: z.enum(['forward', 'reverse']).default('forward'),
  flowSpeed: z.number().min(0).max(1000).default(60),
  flowSpacing: z.number().min(2).max(200).default(24),
  flowLength: z.number().min(1).max(100).default(12),
  flowColor: z.string().default('#38bdf8'),
  sourceNodeId: z.string().optional(),
  sourceAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),
  targetNodeId: z.string().optional(),
  targetAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}

export function getStrokeWidthPx(width: number | unknown): number {
  if (typeof width === 'number' && Number.isFinite(width)) {
    return Math.max(1, Math.min(50, width));
  }
  return 4;
}

export function getStrokeDasharray(style: Props['strokeStyle'], strokeWidth: number): string {
  switch (style) {
    case 'dashed':
      return `${strokeWidth * 3} ${strokeWidth * 2}`;
    case 'dotted':
      return `${strokeWidth} ${strokeWidth * 1.5}`;
    case 'solid':
    default:
      return '';
  }
}
