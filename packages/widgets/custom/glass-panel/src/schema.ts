import { z } from "zod";

export const PropsSchema = z.object({
  variant: z.enum(["neutral", "blue", "warm", "cyan", "emerald", "amber"]).default("neutral").describe("props.variant"),
  blurStrength: z.number().min(0).max(40).default(22).describe("props.blurStrength"),
  surfaceOpacity: z.number().min(0.05).max(1).default(0.36).describe("props.surfaceOpacity"),
  highlightOpacity: z.number().min(0).max(1).default(0.28).describe("props.highlightOpacity"),
  tintStrength: z.number().min(0).max(1).default(0.08).describe("props.tintStrength"),
  cornerRadius: z.number().min(0).max(64).default(20).describe("props.cornerRadius")
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
