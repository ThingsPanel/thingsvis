import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

type AlertLevel = "critical" | "warning" | "info" | "success";

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  const clamped = Math.max(0, Math.min(1, alpha));
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? "";
    const full = raw.length === 3 ? raw.split("").map((item) => item + item).join("") : raw;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channelString = rgbMatch[1] ?? "";
    const parts = channelString.split(",").map((item) => item.trim());
    if (parts.length >= 3) {
      return `rgba(${parts[0] ?? "0"}, ${parts[1] ?? "0"}, ${parts[2] ?? "0"}, ${clamped})`;
    }
  }

  return normalized;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isLightColor(color: string): boolean {
  const normalized = color.trim();
  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1] ?? "";
    const full = raw.length === 3 ? raw.split("").map((item) => item + item).join("") : raw;
    const int = Number.parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.72;
  }

  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channelString = rgbMatch[1] ?? "";
    const parts = channelString.split(",").map((item) => Number(item.trim()));
    if (parts.length >= 3) {
      const luminance = (0.2126 * (parts[0] ?? 0) + 0.7152 * (parts[1] ?? 0) + 0.0722 * (parts[2] ?? 0)) / 255;
      return luminance > 0.72;
    }
  }

  return false;
}

function getLevelColor(level: unknown, colors: WidgetColors): string {
  const normalized = String(level ?? "info").toLowerCase() as AlertLevel;
  if (normalized === "critical") return "#ef4444";
  if (normalized === "warning") return "#f59e0b";
  if (normalized === "success") return "#10b981";
  return colors.primary;
}

function renderList(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const items = Array.isArray(props.items) ? props.items.slice(0, props.maxItems) : [];
  const lightTheme = isLightColor(colors.bg);
  const titleColor = colors.fg;
  const detailColor = withAlpha(colors.fg, 0.68);
  const metaColor = withAlpha(colors.fg, 0.52);
  const rowBg = lightTheme ? withAlpha("#ffffff", 0.72) : withAlpha("#ffffff", 0.05);
  const rowShadow = lightTheme ? withAlpha("#0f172a", 0.05) : withAlpha("#0f172a", 0.12);
  const compactPadding = props.compact ? "10px 12px" : "14px 16px";
  const compactGap = props.compact ? 8 : 12;

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  `;

  if (items.length === 0) {
    element.innerHTML = `
      <div style="
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        color:${metaColor};
        font-size:${props.detailFontSize}px;
      ">No alerts</div>
    `;
    return;
  }

  const rows = items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const accent = getLevelColor(item.level, colors);
    const source = props.showSource && item.source ? `
      <span style="color:${metaColor};font-size:${props.timeFontSize}px;">${escapeHtml(item.source)}</span>
    ` : "";
    const time = props.showTime && item.time ? `
      <span style="color:${metaColor};font-size:${props.timeFontSize}px;">${escapeHtml(item.time)}</span>
    ` : "";
    const detail = props.showDetail && item.detail ? `
      <div style="
        margin-top:6px;
        color:${detailColor};
        font-size:${props.detailFontSize}px;
        line-height:1.45;
      ">${escapeHtml(item.detail)}</div>
    ` : "";

    return `
      <div style="
        display:flex;
        gap:12px;
        padding:${compactPadding};
        border-radius:${props.itemRadius}px;
        background:${rowBg};
        box-shadow:0 10px 24px ${rowShadow};
      ">
        <div style="
          flex:0 0 auto;
          width:10px;
          padding-top:5px;
        ">
          <span style="
            display:block;
            width:10px;
            height:10px;
            border-radius:999px;
            background:${accent};
            box-shadow:0 0 0 6px ${withAlpha(accent, 0.14)};
          "></span>
        </div>
        <div style="min-width:0;flex:1 1 auto;">
          <div style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:12px;
          ">
            <div style="
              min-width:0;
              color:${titleColor};
              font-size:${props.titleFontSize}px;
              font-weight:600;
              line-height:1.4;
            ">${escapeHtml(item.title)}</div>
            ${time}
          </div>
          ${detail}
          ${(source || time) ? `
            <div style="
              display:flex;
              align-items:center;
              gap:10px;
              margin-top:8px;
              flex-wrap:wrap;
            ">${source}</div>
          ` : ""}
        </div>
      </div>
    `;
  });

  element.innerHTML = `
    <div style="
      width:100%;
      height:100%;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      gap:${compactGap}px;
      overflow:auto;
      padding:2px;
    ">
      ${rows.join("")}
    </div>
  `;
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    let colors = resolveWidgetColors(element);

    renderList(element, currentProps, colors);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderList(element, currentProps, colors);
      });
      observer.observe(element);
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderList(element, currentProps, colors);
      },
      destroy: () => {
        observer?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
