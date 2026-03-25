import { z } from "zod";

export const PropsSchema = z.object({
  title: z.string().default("NO.1补水泵").describe("props.title"),
  statusText: z.string().default("运行").describe("props.statusText"),
  activeButton: z.enum(["on", "off"]).default("on").describe("props.activeButton"),
  statusTone: z.enum(["normal", "warning", "fault", "offline"]).default("normal").describe("props.statusTone"),
  onLabel: z.string().default("开").describe("props.onLabel"),
  offLabel: z.string().default("关").describe("props.offLabel"),
  showStatus: z.boolean().default(false).describe("props.showStatus"),
  disabled: z.boolean().default(false).describe("props.disabled"),
  accentColor: z.string().default("#18dcff").describe("props.accentColor"),
  titleColor: z.string().default("#eef7ff").describe("props.titleColor"),
  backgroundColor: z.string().default("rgba(10,19,48,0.62)").describe("props.backgroundColor"),
  borderColor: z.string().default("rgba(24,220,255,0.35)").describe("props.borderColor"),
  inactiveColor: z.string().default("rgba(109,127,152,0.42)").describe("props.inactiveColor"),
  fontSize: z.number().int().min(12).max(30).default(15).describe("props.fontSize"),
  buttonFontSize: z.number().int().min(10).max(26).default(13).describe("props.buttonFontSize"),
  padding: z.number().int().min(0).max(24).default(12).describe("props.padding"),
  borderRadius: z.number().int().min(0).max(16).default(6).describe("props.borderRadius"),
  glow: z.boolean().default(true).describe("props.glow"),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
