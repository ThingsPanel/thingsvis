import { z } from "zod";

export const PropsSchema = z.object({
  preset: z.enum([
    "crystal-white", "crystal-blue", "crystal-purple",
    "frost-white", "frost-warm",
    "minimal-white",
    "solid-white",
    "custom"
  ]).default("crystal-white").describe("props.preset"),
  blurStrength: z.number().min(0).max(40).default(24).describe("props.blurStrength"),
  surfaceOpacity: z.number().min(0.05).max(1).default(0.22).describe("props.surfaceOpacity"),
  highlightOpacity: z.number().min(0).max(1).default(0.32).describe("props.highlightOpacity"),
  tintStrength: z.number().min(0).max(1).default(0.35).describe("props.tintStrength")
});

export type Props = z.infer<typeof PropsSchema>;

/** 精品预设 - 每个都是独立调优的质感+色调组合 */
export const PRESETS: Record<string, {
  blur: number;
  opacity: number;
  highlight: number;
  tint: number;
  color: string;
  desc: string;
}> = {
  // ===== 水晶系列 - 高透高亮 =====
  "crystal-white": {
    blur: 26,
    opacity: 0.18,
    highlight: 0.38,
    tint: 0.0,
    color: "#f8fbff", // 纯白
    desc: "💎 水晶白 - 最通透"
  },
  "crystal-blue": {
    blur: 26,
    opacity: 0.18,
    highlight: 0.38,
    tint: 0.45,
    color: "#60a5fa", // 明亮蓝
    desc: "💎 水晶蓝 - 科技冷调"
  },
  "crystal-purple": {
    blur: 26,
    opacity: 0.18,
    highlight: 0.38,
    tint: 0.4,
    color: "#a78bfa", // 优雅紫
    desc: "💎 水晶紫 - 高端优雅"
  },

  // ===== 磨砂系列 - 平衡柔和 =====
  "frost-white": {
    blur: 18,
    opacity: 0.42,
    highlight: 0.22,
    tint: 0.0,
    color: "#f8fbff", // 纯白
    desc: "🧊 磨砂白 - 平衡柔和"
  },
  "frost-warm": {
    blur: 18,
    opacity: 0.42,
    highlight: 0.22,
    tint: 0.35,
    color: "#fdba74", // 暖橙色
    desc: "🧊 磨砂暖 - 温暖亲和"
  },

  // ===== 极简系列 - 轻薄透亮 =====
  "minimal-white": {
    blur: 14,
    opacity: 0.12,
    highlight: 0.18,
    tint: 0.0,
    color: "#f8fbff", // 纯白
    desc: "✨ 极简白 - 最轻薄"
  },

  // ===== 半实心系列 - 强背景遮挡 =====
  "solid-white": {
    blur: 10,
    opacity: 0.78,
    highlight: 0.15,
    tint: 0.0,
    color: "#f8fbff", // 纯白
    desc: "🔲 半实心白 - 强遮挡"
  },

  // ===== 自定义 =====
  "custom": {
    blur: 24,
    opacity: 0.22,
    highlight: 0.32,
    tint: 0.35,
    color: "#60a5fa", // 默认蓝
    desc: "⚙️ 自定义 - 手动调节"
  }
};

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
