import { z } from "zod";

export const PropsSchema = z.object({
  variant: z.enum(["neutral", "blue", "warm", "cyan", "emerald", "amber"]).default("neutral").describe("props.variant"),
  preset: z.enum(["crystal", "frost", "solid", "minimal", "custom"]).default("crystal").describe("props.preset"),
  blurStrength: z.number().min(0).max(40).default(24).describe("props.blurStrength"),
  surfaceOpacity: z.number().min(0.05).max(1).default(0.22).describe("props.surfaceOpacity"),
  highlightOpacity: z.number().min(0).max(1).default(0.32).describe("props.highlightOpacity"),
  tintStrength: z.number().min(0).max(1).default(0.1).describe("props.tintStrength")
});

export type Props = z.infer<typeof PropsSchema>;

/** Preset configurations for quick selection */
export const PRESETS: Record<string, { blur: number; opacity: number; highlight: number; tint: number; desc: string }> = {
  crystal: { blur: 24, opacity: 0.22, highlight: 0.32, tint: 0.1, desc: "水晶质感 - 高透高亮" },
  frost: { blur: 18, opacity: 0.38, highlight: 0.22, tint: 0.08, desc: "磨砂质感 - 平衡柔和" },
  solid: { blur: 8, opacity: 0.82, highlight: 0.12, tint: 0.05, desc: "半实心 - 低透明" },
  minimal: { blur: 12, opacity: 0.15, highlight: 0.15, tint: 0.05, desc: "极简 - 轻薄透亮" },
  custom: { blur: 24, opacity: 0.22, highlight: 0.32, tint: 0.1, desc: "自定义 - 手动调节" }
};

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
