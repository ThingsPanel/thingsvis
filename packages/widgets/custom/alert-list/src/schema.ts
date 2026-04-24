import { z } from "zod";

const DEFAULT_ITEMS = [
  {
    level: "critical",
    title: "冷水机组 #02 温度异常",
    detail: "出水温度 18.6°C，超过阈值 3.1°C",
    source: "A2 产线",
    time: "09:42"
  },
  {
    level: "warning",
    title: "空压机 #03 震动偏高",
    detail: "最近 15 分钟均值超出基线 11%",
    source: "动力站",
    time: "09:18"
  },
  {
    level: "info",
    title: "配电柜 #07 维护完成",
    detail: "已恢复在线并重新接入监测",
    source: "B1 配电间",
    time: "08:56"
  }
] as const;

export const PropsSchema = z.object({
  title: z.string().default('告警信息').describe("props.title"),
  showTitle: z.boolean().default(false).describe("props.showTitle"),
  items: z.array(z.any()).default(() => DEFAULT_ITEMS.map((item) => ({ ...item }))).describe("props.items"),
  maxItems: z.number().int().min(1).max(100).default(6).describe("props.maxItems"),
  autoScroll: z.boolean().default(true).describe("props.autoScroll"),
  scrollSpeed: z.enum(["slow", "normal", "fast"]).default("normal").describe("props.scrollSpeed"),
  showTime: z.boolean().default(true).describe("props.showTime"),
  showSource: z.boolean().default(true).describe("props.showSource"),
  showDetail: z.boolean().default(true).describe("props.showDetail"),
  titleFontSize: z.number().int().min(10).max(28).default(14).describe("props.titleFontSize"),
  detailFontSize: z.number().int().min(10).max(24).default(12).describe("props.detailFontSize"),
  timeFontSize: z.number().int().min(10).max(24).default(11).describe("props.timeFontSize")
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
