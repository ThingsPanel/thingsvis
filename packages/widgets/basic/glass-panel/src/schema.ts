import { z } from "zod";

export const PropsSchema = z.object({
  preset: z.enum([
    "crystal-white", "crystal-blue", "crystal-purple",
    "frost-white", "frost-warm",
    "minimal-white",
    "solid-white",
    "custom"
  ]).default("crystal-white").describe("props.preset"),
  // 风格模式：控制立体感程度
  styleMode: z.enum(["glass", "flat", "line"]).default("glass").describe("props.styleMode"),
  // 自定义参数：作为对预设的微调偏移量
  blurOffset: z.number().min(-20).max(20).default(0).describe("props.blurOffset"),
  opacityOffset: z.number().min(-0.5).max(0.5).default(0).describe("props.opacityOffset"),
  highlightOffset: z.number().min(-0.5).max(0.5).default(0).describe("props.highlightOffset"),
  tintOffset: z.number().min(-0.5).max(0.5).default(0).describe("props.tintOffset")
});

export type Props = z.infer<typeof PropsSchema>;

/** 预设基础值类型 */
export interface PresetValues {
  blur: number;
  opacity: number;
  highlight: number;
  tint: number;
  color: string;
  noise: number;
  desc: string;
}

/** 精品预设 - 每个都是独立调优的质感+色调组合 */
export const PRESETS: Record<Props["preset"], PresetValues> = {
  // ===== 水晶系列 - 高透高亮 =====
  "crystal-white": {
    blur: 32,
    opacity: 0.05,  // 极低透明度，接近纯透
    highlight: 0.48,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.02,
    desc: "💎 水晶白 - 最通透"
  },
  "crystal-blue": {
    blur: 32,
    opacity: 0.05,
    highlight: 0.48,
    tint: 0.55,
    color: "#60a5fa",
    noise: 0.02,
    desc: "💎 水晶蓝 - 科技冷调"
  },
  "crystal-purple": {
    blur: 32,
    opacity: 0.05,
    highlight: 0.48,
    tint: 0.5,
    color: "#a78bfa",
    noise: 0.02,
    desc: "💎 水晶紫 - 高端优雅"
  },

  // ===== 磨砂系列 - 平衡柔和 =====
  "frost-white": {
    blur: 24,
    opacity: 0.15,  // 更透
    highlight: 0.35,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.04,
    desc: "🧊 磨砂白 - 平衡柔和"
  },
  "frost-warm": {
    blur: 24,
    opacity: 0.15,
    highlight: 0.35,
    tint: 0.48,
    color: "#fdba74",
    noise: 0.04,
    desc: "🧊 磨砂暖 - 温暖亲和"
  },

  // ===== 极简系列 - 轻薄透亮 =====
  "minimal-white": {
    blur: 20,
    opacity: 0.02,  // 几乎看不见
    highlight: 0.28,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.01,
    desc: "✨ 极简白 - 最轻薄"
  },

  // ===== 半实心系列 - 强背景遮挡 =====
  "solid-white": {
    blur: 12,
    opacity: 0.72,
    highlight: 0.18,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.04,
    desc: "🔲 半实心白 - 强遮挡"
  },

  // ===== 自定义 =====
  "custom": {
    blur: 24,
    opacity: 0.15,
    highlight: 0.35,
    tint: 0.0,
    color: "#60a5fa",
    noise: 0.04,
    desc: "⚙️ 自定义 - 从滑块基准值开始"
  }
};

/**
 * 计算最终渲染值：预设值 + 用户微调偏移
 */
export function computeFinalValues(
  preset: PresetValues,
  blurOffset: number,
  opacityOffset: number,
  highlightOffset: number,
  tintOffset: number
): PresetValues {
  return {
    ...preset,
    blur: Math.max(0, Math.min(40, preset.blur + blurOffset)),
    opacity: Math.max(0.05, Math.min(1, preset.opacity + opacityOffset)),
    highlight: Math.max(0, Math.min(1, preset.highlight + highlightOffset)),
    tint: Math.max(0, Math.min(1, preset.tint + tintOffset)),
    desc: preset.desc
  };
}

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
