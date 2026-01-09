import { z } from 'zod';

const PointSchema = z.object({
  x: z.number().describe('x'),
  y: z.number().describe('y'),
});

export const PropsSchema = z.object({
  // =========================
  // Path
  // =========================

  /** 线型预设 */
  kind: z
    .enum(['polyline', 'straight', 'curve', 'mind'])
    .default('straight')
    .describe('线型'),

  /** 路径点（支持 0..1 的归一化坐标；或直接使用像素） */
  points: z
    .array(PointSchema)
    .default([
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ])
    .describe('折线路径点'),

  // =========================
  // Style (Stroke)
  // =========================

  stroke: z.string().default('#6965db').describe('线条颜色'),
  strokeWidth: z.enum(['thin', 'medium', 'thick']).default('medium').describe('线宽'),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid').describe('线条样式'),
  opacity: z.number().min(0).max(1).default(1).describe('透明度'),
  lineCap: z.enum(['butt', 'round', 'square']).default('round').describe('端点样式'),

  // =========================
  // Sloppiness (Hand-drawn style)
  // =========================

  sloppiness: z.enum(['none', 'low', 'high']).default('none').describe('粗糙度'),

  // =========================
  // Arrow
  // =========================

  /** 线条类型：直线、曲线、折线 */
  arrowType: z.enum(['straight', 'curved', 'elbow']).default('straight').describe('箭头类型'),

  /** 起点箭头样式 */
  arrowStart: z.enum(['none', 'arrow']).default('none').describe('起点箭头'),

  /** 终点箭头样式 */
  arrowEnd: z.enum(['none', 'arrow']).default('arrow').describe('终点箭头'),

  arrowSize: z.number().min(4).max(40).default(12).describe('箭头大小'),

  // =========================
  // Flow (Animation)
  // =========================

  flowEnabled: z.boolean().default(false).describe('流动动画'),
  flowSpeed: z.number().min(0).max(1000).default(120).describe('流动速度(px/s)'),
  flowSpacing: z.number().min(2).max(200).default(16).describe('流动间距(px)'),

  // =========================
  // Legacy (backward compatibility)
  // =========================

  /** @deprecated 使用 arrowStart 和 arrowEnd 替代 */
  direction: z.enum(['none', 'forward', 'reverse', 'bidirectional']).default('forward').describe('箭头方向（兼容）'),
  /** @deprecated 使用 strokeStyle 替代 */
  dashPattern: z.string().default('').describe('虚线 (SVG stroke-dasharray)'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}

// =========================
// Helper functions
// =========================

/** 将 strokeWidth 枚举转换为实际像素值 */
export function getStrokeWidthPx(width: Props['strokeWidth']): number {
  switch (width) {
    case 'thin': return 2;
    case 'medium': return 4;
    case 'thick': return 8;
    default: return 4;
  }
}

/** 将 strokeStyle 枚举转换为 SVG dasharray */
export function getStrokeDasharray(style: Props['strokeStyle'], strokeWidth: number): string {
  switch (style) {
    case 'dashed': return `${strokeWidth * 3} ${strokeWidth * 2}`;
    case 'dotted': return `${strokeWidth} ${strokeWidth * 1.5}`;
    case 'solid':
    default: return '';
  }
}
