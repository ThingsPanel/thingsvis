import { z } from "zod";

export const PropsSchema = z.object({
  preset: z.enum([
    "crystal-white", "crystal-blue", "crystal-purple",
    "frost-white", "frost-warm",
    "minimal-white",
    "solid-white",
    "custom"
  ]).default("crystal-white").describe("props.preset"),
  blurStrength: z.number().min(0).max(40).default(26).describe("props.blurStrength"),
  surfaceOpacity: z.number().min(0.05).max(1).default(0.15).describe("props.surfaceOpacity"),
  highlightOpacity: z.number().min(0).max(1).default(0.38).describe("props.highlightOpacity"),
  tintStrength: z.number().min(0).max(1).default(0.4).describe("props.tintStrength")
});

export type Props = z.infer<typeof PropsSchema>;

/** 精品预设 - 每个都是独立调优的质感+色调组合 */
export const PRESETS: Record<string, {
  blur: number;
  opacity: number;
  highlight: number;
  tint: number;
  color: string;
  noise: number; // 噪点强度
  desc: string;
}> = {
  // ===== 水晶系列 - 高透高亮 =====
  "crystal-white": {
    blur: 28,
    opacity: 0.12,  // 更低透明度，更通透
    highlight: 0.42,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.03,
    desc: "💎 水晶白 - 最通透"
  },
  "crystal-blue": {
    blur: 28,
    opacity: 0.12,
    highlight: 0.42,
    tint: 0.5,
    color: "#60a5fa",
    noise: 0.03,
    desc: "💎 水晶蓝 - 科技冷调"
  },
  "crystal-purple": {
    blur: 28,
    opacity: 0.12,
    highlight: 0.42,
    tint: 0.45,
    color: "#a78bfa",
    noise: 0.03,
    desc: "💎 水晶紫 - 高端优雅"
  },

  // ===== 磨砂系列 - 平衡柔和 =====
  "frost-white": {
    blur: 20,
    opacity: 0.28,  // 磨砂稍实一些
    highlight: 0.28,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.06,    // 更多纹理
    desc: "🧊 磨砂白 - 平衡柔和"
  },
  "frost-warm": {
    blur: 20,
    opacity: 0.28,
    highlight: 0.28,
    tint: 0.42,
    color: "#fdba74",
    noise: 0.06,
    desc: "🧊 磨砂暖 - 温暖亲和"
  },

  // ===== 极简系列 - 轻薄透亮 =====
  "minimal-white": {
    blur: 16,
    opacity: 0.08,  // 非常薄
    highlight: 0.22,
    tint: 0.0,
    color: "#ffffff",
    noise: 0.02,    // 极少纹理
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
    blur: 26,
    opacity: 0.15,
    highlight: 0.38,
    tint: 0.4,
    color: "#60a5fa",
    noise: 0.04,
    desc: "⚙️ 自定义 - 手动调节"
  }
};

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
