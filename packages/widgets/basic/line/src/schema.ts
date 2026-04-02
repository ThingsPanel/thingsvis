import { z } from 'zod';

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PropsSchema = z.object({
  // === 路由 ===
  points: z.array(PointSchema).default([{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }]),
  routerType: z.enum(['straight', 'orthogonal', 'curved']).default('straight'),

  // === 节点绑定 ===
  sourceNodeId: z.string().optional(),
  sourcePortId: z.string().optional(),
  sourceAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),
  targetNodeId: z.string().optional(),
  targetPortId: z.string().optional(),
  targetAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),

  // === 样式 ===
  stroke: z.string().default('#2563eb'),
  strokeWidth: z.number().min(1).max(50).default(2),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  opacity: z.number().min(0).max(1).default(1),

  // === 箭头 ===
  arrowStart: z.enum(['none', 'arrow', 'open-arrow']).default('none'),
  arrowEnd: z.enum(['none', 'arrow', 'open-arrow']).default('arrow'),
  arrowSize: z.number().min(4).max(40).default(10),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}

export function getStrokeWidthPx(width: Props['strokeWidth'] | 'thin' | 'medium' | 'thick' | unknown): number {
  if (typeof width === 'number' && Number.isFinite(width)) {
    return Math.max(1, Math.min(50, width));
  }
  return 2;
}

export function getStrokeDasharray(style: Props['strokeStyle'], strokeWidth: number): string {
  switch (style) {
    case 'dashed': return `${strokeWidth * 3} ${strokeWidth * 2}`;
    case 'dotted': return `${strokeWidth} ${strokeWidth * 1.5}`;
    case 'solid':
    default: return '';
  }
}
