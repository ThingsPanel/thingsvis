import { defineWidget, resolveWidgetColors, type WidgetColors } from "@thingsvis/widget-sdk";
import { controls } from "./controls";
import { metadata } from "./metadata";
import { PropsSchema, type Props } from "./schema";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  const clamped = clamp(alpha, 0, 1);
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

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveAlignment(align: Props["align"]): {
  alignItems: string;
  textAlign: string;
  dividerAlign: string;
} {
  if (align === "center") {
    return { alignItems: "center", textAlign: "center", dividerAlign: "center" };
  }
  if (align === "right") {
    return { alignItems: "flex-end", textAlign: "right", dividerAlign: "flex-end" };
  }
  return { alignItems: "flex-start", textAlign: "left", dividerAlign: "flex-start" };
}

function containsCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function renderHeader(element: HTMLElement, props: Props, colors: WidgetColors): void {
  const alignment = resolveAlignment(props.align);
  const accentColor = props.accentColor || colors.primary || colors.series[0] || "#4e80ee";
  const titleColor = props.titleColor || colors.fg;
  const subtitleColor = props.subtitleColor || withAlpha(colors.fg, 0.68);
  const dividerGlow = props.dividerGlow ? `0 0 12px ${withAlpha(accentColor, 0.32)}` : "none";
  const eyebrowIsCjk = containsCjk(props.eyebrow);

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
      display:flex;
      flex-direction:column;
      justify-content:flex-start;
      box-sizing:border-box;
      position:relative;
      padding:0;
      color:${titleColor};
      text-align:${alignment.textAlign};
    ">
      <div style="
        width:100%;
        display:flex;
        flex-direction:column;
        align-items:${alignment.alignItems};
        gap:8px;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          max-width:100%;
          width:100%;
        ">
          <span style="
            width:11px;
            height:11px;
            border-radius:999px;
            background:${accentColor};
            flex:0 0 auto;
          "></span>
          <span style="
            font-size:${props.eyebrowFontSize}px;
            letter-spacing:${eyebrowIsCjk ? "0.12em" : "0.2em"};
            text-transform:${eyebrowIsCjk ? "none" : "uppercase"};
            color:${withAlpha(accentColor, 0.92)};
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            font-weight:700;
          ">${escapeHtml(props.eyebrow)}</span>
        </div>
        <div style="
          width:100%;
          font-size:${props.titleFontSize}px;
          line-height:1.06;
          font-weight:800;
          letter-spacing:0;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${escapeHtml(props.title)}</div>
        ${
          props.subtitle
            ? `<div style="
                width:100%;
                font-size:${props.subtitleFontSize}px;
                color:${subtitleColor};
                line-height:1.45;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
              ">${escapeHtml(props.subtitle)}</div>`
            : ""
        }
      </div>
      ${
        props.metric
          ? `<div style="
              position:absolute;
              top:2px;
              right:0;
              color:${withAlpha(colors.fg, 0.54)};
              font-size:${props.metricFontSize}px;
              font-weight:500;
              white-space:nowrap;
            ">${escapeHtml(props.metric)}</div>`
          : ""
      }
      ${
        props.showDivider
          ? `<div style="
              margin-top:14px;
              width:100%;
              display:flex;
              justify-content:${alignment.dividerAlign};
            ">
              <div style="
                width:${props.align === "center" ? "72%" : "100%"};
                height:1px;
                background:linear-gradient(90deg, ${withAlpha(colors.axis, 0.18)}, ${withAlpha(accentColor, 0.88)}, ${withAlpha(colors.axis, 0.18)});
                box-shadow:${dividerGlow};
              "></div>
            </div>`
          : ""
      }
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

    renderHeader(element, currentProps, colors);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderHeader(element, currentProps, colors);
      });
      observer.observe(element);
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        renderHeader(element, currentProps, colors);
      },
      destroy: () => {
        observer?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
