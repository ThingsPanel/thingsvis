import { z } from "zod";

export const PropsSchema = z.object({
  eyebrow: z.string().default("设备概览").describe("props.eyebrow"),
  title: z.string().default("分区标题").describe("props.title"),
  subtitle: z.string().default("实时指标与状态").describe("props.subtitle"),
  metric: z.string().default("").describe("props.metric"),
  align: z.enum(["left", "center", "right"]).default("left").describe("props.align"),
  accentColor: z.string().default("").describe("props.accentColor"),
  titleColor: z.string().default("").describe("props.titleColor"),
  subtitleColor: z.string().default("").describe("props.subtitleColor"),
  showDivider: z.boolean().default(false).describe("props.showDivider"),
  dividerGlow: z.boolean().default(false).describe("props.dividerGlow"),
  eyebrowFontSize: z.number().min(8).max(24).default(12).describe("props.eyebrowFontSize"),
  titleFontSize: z.number().min(14).max(64).default(32).describe("props.titleFontSize"),
  subtitleFontSize: z.number().min(10).max(32).default(13).describe("props.subtitleFontSize"),
  metricFontSize: z.number().min(10).max(32).default(13).describe("props.metricFontSize")
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
