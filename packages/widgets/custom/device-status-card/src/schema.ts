import { z } from "zod";

export const PropsSchema = z.object({
  title: z.string().default("冷水机组 #02").describe("props.title"),
  zone: z.string().default("A2 产线").describe("props.zone"),
  status: z.enum(["online", "warning", "offline", "maintenance"]).default("online").describe("props.status"),
  statusLabel: z.string().default("在线").describe("props.statusLabel"),
  primaryValue: z.union([z.number(), z.string()]).default(63.2).describe("props.primaryValue"),
  primaryUnit: z.string().default("%").describe("props.primaryUnit"),
  primaryLabel: z.string().default("当前负载").describe("props.primaryLabel"),
  secondaryValue: z.union([z.number(), z.string()]).default(18.6).describe("props.secondaryValue"),
  secondaryUnit: z.string().default("°C").describe("props.secondaryUnit"),
  secondaryLabel: z.string().default("出口温度").describe("props.secondaryLabel"),
  progress: z.number().min(0).max(100).default(63).describe("props.progress"),
  progressColor: z.string().default("").describe("props.progressColor"),
  titleFontSize: z.number().int().min(10).max(32).default(16).describe("props.titleFontSize"),
  metaFontSize: z.number().int().min(10).max(24).default(12).describe("props.metaFontSize"),
  valueFontSize: z.number().int().min(14).max(48).default(30).describe("props.valueFontSize"),
  compact: z.boolean().default(false).describe("props.compact")
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
