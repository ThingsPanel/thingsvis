import { z } from "zod";

export const PropsSchema = z.object({
  title: z.string().default("分区标题").describe("props.title"),
  subtitle: z.string().default("").describe("props.subtitle"),
  variant: z.enum(["panel", "ribbon"]).default("panel").describe("props.variant"),
  align: z.enum(["left", "center"]).default("left").describe("props.align"),
  accentColor: z.string().default("#ff2b7a").describe("props.accentColor"),
  lineColor: z.string().default("#4ce7ff").describe("props.lineColor"),
  backgroundColor: z.string().default("rgba(10,19,48,0.64)").describe("props.backgroundColor"),
  titleColor: z.string().default("#eef7ff").describe("props.titleColor"),
  subtitleColor: z.string().default("rgba(238,247,255,0.68)").describe("props.subtitleColor"),
  fontSize: z.number().int().min(12).max(42).default(18).describe("props.fontSize"),
  subtitleFontSize: z.number().int().min(10).max(24).default(12).describe("props.subtitleFontSize"),
  paddingX: z.number().int().min(0).max(48).default(14).describe("props.paddingX"),
  paddingY: z.number().int().min(0).max(32).default(8).describe("props.paddingY"),
  stripeWidth: z.number().int().min(0).max(96).default(42).describe("props.stripeWidth"),
  borderRadius: z.number().int().min(0).max(20).default(4).describe("props.borderRadius"),
  showStripe: z.boolean().default(true).describe("props.showStripe"),
  showTail: z.boolean().default(true).describe("props.showTail"),
  glow: z.boolean().default(true).describe("props.glow"),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
