import { z } from 'zod';

const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PropsSchema = z.object({
  // === 路由（仅正交） ===
  waypoints: z.array(PointSchema).default([]),

  // === 节点绑定 ===
  sourceNodeId: z.string().optional(),
  sourcePortId: z.string().optional(),
  sourceAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),
  targetNodeId: z.string().optional(),
  targetPortId: z.string().optional(),
  targetAnchor: z.enum(['top', 'right', 'bottom', 'left', 'center']).optional(),

  // === 管道外观 ===
  pipeColor: z.string().default('#334155'),       // 液体/主色
  pipeBackground: z.string().default('#0f172a'),   // 管壁色
  strokeWidth: z.number().min(2).max(80).default(12),
  opacity: z.number().min(0).max(1).default(1),

  // === 流动动画 ===
  flowEnabled: z.boolean().default(false),
  flowSpeed: z.number().min(0).max(1000).default(60),
  flowLength: z.number().min(1).max(200).default(16),
  flowSpacing: z.number().min(2).max(200).default(24),
  flowColor: z.string().default('#0ea5e9'),
  flowDirection: z.enum(['forward', 'reverse']).default('forward'),

  // === 发光 ===
  glowEnabled: z.boolean().default(false),
  glowColor: z.string().default('#0ea5e9'),
  glowIntensity: z.number().min(1).max(10).default(3),

  // =========================
  // Legacy (backward compatibility)
  // =========================
  points: z.array(PointSchema).optional(),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}

export function getStrokeWidthPx(width: number | unknown): number {
  if (typeof width === 'number' && Number.isFinite(width)) {
    return Math.max(1, Math.min(80, width));
  }
  return 12;
}

export function getStrokeDasharray(style: 'solid' | 'dashed' | 'dotted', strokeWidth: number): string {
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

