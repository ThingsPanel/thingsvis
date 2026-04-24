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

function getLevelColor(level: unknown, colors: WidgetColors): string {
  const normalized = String(level ?? "info").toLowerCase() as AlertLevel;
  if (normalized === "critical") return "#ef4444";
  if (normalized === "warning") return "#f59e0b";
  if (normalized === "success") return "#10b981";
  return colors.primary;
}

function formatTimeStr(val: unknown): string {
  const s = String(val ?? "").trim();
  if (!s) return "";
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}`;
  }
  return s;
}

const SCROLL_SPEED_MAP: Record<string, number> = {
  slow: 0.3,
  normal: 0.6,
  fast: 1.2
};

function renderList(element: HTMLElement, props: Props, colors: WidgetColors): (() => void) | null {
  const items = Array.isArray(props.items) ? props.items.slice(0, props.maxItems) : [];
  const titleColor = colors.fg;
  const detailColor = withAlpha(colors.fg, 0.72);
  const metaColor = withAlpha(colors.fg, 0.45);
  const rowBg = withAlpha(colors.fg, 0.025);
  const rowBorder = withAlpha(colors.fg, 0.06);
  const compactPadding = "12px 14px";
  const compactGap = 8;
  const radius = 6;

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: visible;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;

  if (items.length === 0) {
    const emptyText = "暂无告警";
    element.innerHTML = `
      <div style="
        width:100%;
        height:100%;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:10px;
        color:${metaColor};
        font-size:${props.detailFontSize}px;
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${metaColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>${emptyText}</span>
      </div>
    `;
    return null;
  }

  const styleId = "tv-alert-list-keyframes";
  let styleTag = element.querySelector(`#${styleId}`) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    element.appendChild(styleTag);
  }
  styleTag.textContent = `
    @keyframes tv-alert-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 6px var(--pulse-ring); }
      50% { opacity: 0.6; box-shadow: 0 0 0 10px transparent; }
    }
    .tv-alert-list-scroller {
      scrollbar-width: thin;
      scrollbar-color: ${withAlpha(colors.fg, 0.15)} transparent;
    }
    .tv-alert-list-scroller::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .tv-alert-list-scroller::-webkit-scrollbar-thumb {
      background: ${withAlpha(colors.fg, 0.15)};
      border-radius: 4px;
    }
    .tv-alert-list-scroller::-webkit-scrollbar-track {
      background: transparent;
    }
    .tv-alert-list-item {
      transition: background 0.2s, border-color 0.2s;
    }
    .tv-alert-list-item:hover {
      background: ${withAlpha(colors.fg, 0.045)} !important;
      border-color: ${withAlpha(colors.fg, 0.1)} !important;
    }
  `;

  const rows = items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const accent = getLevelColor(item.level, colors);
    const isCritical = String(item.level ?? "").toLowerCase() === "critical";
    const pulseStyle = isCritical
      ? `--pulse-ring:${withAlpha(accent, 0.14)};animation:tv-alert-pulse 2s ease-in-out infinite;`
      : `box-shadow:0 0 0 6px ${withAlpha(accent, 0.14)};`;

    const source = props.showSource && item.source ? `
      <span style="color:${metaColor};font-size:${props.timeFontSize}px;flex-shrink:0;">${escapeHtml(item.source)}</span>
    ` : "";
    const timeText = formatTimeStr(item.time);
    const time = props.showTime && timeText ? `
      <span style="color:${metaColor};font-size:${props.timeFontSize}px;flex-shrink:0;white-space:nowrap;">${escapeHtml(timeText)}</span>
    ` : "";
    const detail = props.showDetail && item.detail ? `
      <div style="
        margin-top:6px;
        color:${detailColor};
        font-size:${props.detailFontSize}px;
        line-height:1.45;
        word-break:break-all;
      ">${escapeHtml(item.detail)}</div>
    ` : "";

    return `
      <div class="tv-alert-list-item" style="
        display:flex;
        gap:12px;
        padding:${compactPadding};
        border-radius:${radius}px;
        background:${rowBg};
        border:1px solid ${rowBorder};
        flex:0 0 auto;
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
            ${pulseStyle}
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
              word-break:break-all;
            ">${escapeHtml(item.title)}</div>
            ${time}
          </div>
          ${detail}
          ${source ? `
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

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "tv-alert-list-scroller";
  scrollContainer.style.cssText = `
    width:100%;
    height:100%;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
    gap:${compactGap}px;
    overflow-y:auto;
    overflow-x:hidden;
    padding:2px;
  `;
  scrollContainer.innerHTML = rows.join("");
  element.innerHTML = "";
  
  if (props.showTitle && props.title) {
    const titleEl = document.createElement("div");
    titleEl.style.cssText = `
      flex: 0 0 auto;
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 600;
      color: ${colors.fg};
      text-align: left;
    `;
    titleEl.textContent = props.title;
    element.appendChild(titleEl);
    
    // Adjust scrollContainer to stretch
    scrollContainer.style.flex = "1 1 0";
    scrollContainer.style.height = "0"; // so it scrolls
    
    // Ensure element is flex column
    element.style.display = "flex";
    element.style.flexDirection = "column";
  }

  element.appendChild(styleTag);
  element.appendChild(scrollContainer);

  if (!props.autoScroll) {
    return null;
  }

  const speed = SCROLL_SPEED_MAP[props.scrollSpeed] ?? 0.6;
  let rafId = 0;
  let paused = false;

  // 克隆节点实现循环滚动
  const clonedHtml = rows.join("");
  scrollContainer.innerHTML = clonedHtml + clonedHtml;

  scrollContainer.addEventListener("mouseenter", () => { paused = true; });
  scrollContainer.addEventListener("mouseleave", () => { paused = false; });

  let top = 0;
  const tick = () => {
    if (!paused) {
      if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        top += speed;
        // 因为填入了2份一样的内容，一旦滚动过整个第一份(总高度一半)，就瞬间跳回0
        const halfHeight = scrollContainer.scrollHeight / 2;
        if (top >= halfHeight) {
          top = top - halfHeight;
        }
        scrollContainer.scrollTop = top;
      }
    } else {
      // 触碰悬停导致暂停时，允许用户自己滑动滚轮。我们需要同步真实scrollTop和内部top的状态，防止移开鼠标后跳跃回传
      top = scrollContainer.scrollTop;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  return () => { cancelAnimationFrame(rafId); };
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
    let cleanupScroll: (() => void) | null = null;

    cleanupScroll = renderList(element, currentProps, colors);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
        cleanupScroll = renderList(element, currentProps, colors);
      });
      observer.observe(element);
    }

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        colors = resolveWidgetColors(element);
        if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
        cleanupScroll = renderList(element, currentProps, colors);
      },
      destroy: () => {
        if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
        observer?.disconnect();
        element.innerHTML = "";
      }
    };
  }
});

export default Main;
