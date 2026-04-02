import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

type StatusName = Props["status"];

const STATUS_COLORS: Record<StatusName, string> = {
  online: "#10b981",
  warning: "#f59e0b",
  offline: "#94a3b8",
  maintenance: "#7c5cfc"
};

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
  return false;
}

function renderCard(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const lightTheme = isLightColor(colors.bg);
  const statusColor = STATUS_COLORS[props.status] ?? colors.primary;
  const progressColor = props.progressColor || statusColor;
  const surfaceBg = lightTheme ? withAlpha("#ffffff", 0.62) : withAlpha("#ffffff", 0.06);
  const shadowColor = lightTheme ? withAlpha("#0f172a", 0.05) : withAlpha("#0f172a", 0.16);
  const titleColor = colors.fg;
  const metaColor = withAlpha(colors.fg, 0.62);
  const subtleColor = withAlpha(colors.fg, 0.48);
  const compactPadding = props.compact ? "14px 16px" : "18px 18px";
  const gap = props.compact ? 10 : 14;

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  `;

  element.innerHTML = `
    <div style="
      width:100%;
      height:100%;
      box-sizing:border-box;
      border-radius:18px;
      background:${surfaceBg};
      box-shadow:0 10px 26px ${shadowColor};
      padding:${compactPadding};
      display:flex;
      flex-direction:column;
      gap:${gap}px;
    ">
      <div style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
      ">
        <div style="min-width:0;">
          <div style="
            color:${titleColor};
            font-size:${props.titleFontSize}px;
            font-weight:600;
            line-height:1.35;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          ">${escapeHtml(props.title)}</div>
          <div style="
            margin-top:4px;
            color:${metaColor};
            font-size:${props.metaFontSize}px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          ">${escapeHtml(props.zone)}</div>
        </div>
        <div style="
          flex:0 0 auto;
          padding:6px 10px;
          border-radius:999px;
          background:${withAlpha(statusColor, 0.12)};
          color:${statusColor};
          font-size:${props.metaFontSize}px;
          font-weight:600;
          line-height:1;
        ">${escapeHtml(props.statusLabel)}</div>
      </div>

      <div style="
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:18px;
      ">
        <div>
          <div style="
            color:${metaColor};
            font-size:${props.metaFontSize}px;
            margin-bottom:4px;
          ">${escapeHtml(props.primaryLabel)}</div>
          <div style="
            color:${titleColor};
            font-size:${props.valueFontSize}px;
            font-weight:700;
            line-height:1;
            letter-spacing:-0.02em;
          ">
            ${escapeHtml(props.primaryValue)}<span style="font-size:${Math.max(props.valueFontSize * 0.48, 12)}px;margin-left:4px;font-weight:600;color:${metaColor};">${escapeHtml(props.primaryUnit)}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="
            color:${metaColor};
            font-size:${props.metaFontSize}px;
            margin-bottom:4px;
          ">${escapeHtml(props.secondaryLabel)}</div>
          <div style="
            color:${titleColor};
            font-size:${Math.max(props.valueFontSize * 0.6, 16)}px;
            font-weight:600;
            line-height:1.1;
          ">
            ${escapeHtml(props.secondaryValue)}<span style="font-size:${Math.max(props.valueFontSize * 0.34, 11)}px;margin-left:4px;color:${subtleColor};">${escapeHtml(props.secondaryUnit)}</span>
          </div>
        </div>
      </div>

      <div>
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:8px;
          color:${metaColor};
          font-size:${props.metaFontSize}px;
        ">
          <span>运行强度</span>
          <span>${Math.round(props.progress)}%</span>
        </div>
        <div style="
          width:100%;
          height:8px;
          border-radius:999px;
          background:${withAlpha(colors.fg, lightTheme ? 0.08 : 0.12)};
          overflow:hidden;
        ">
          <div style="
            width:${Math.max(0, Math.min(100, props.progress))}%;
            height:100%;
            border-radius:999px;
            background:linear-gradient(90deg, ${withAlpha(progressColor, 0.72)}, ${progressColor});
          "></div>
        </div>
      </div>
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

    renderCard(element, currentProps, colors);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderCard(element, currentProps, colors);
      });
      observer.observe(element);
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderCard(element, currentProps, colors);
      },
      destroy: () => {
        observer?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
