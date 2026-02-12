export type Mode = "fixed" | "infinite" | "grid";

export function normalizeMode(input: string | Mode): Mode {
  const normalized = input.toLowerCase();
  if (normalized === "infinite") return "infinite";
  if (normalized === "grid") return "grid";
  return "fixed";
}

export function calculateScaleToFit(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
  padding = 0,
  allowScaleUp = false
): number {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;

  if (contentWidth <= 0 || contentHeight <= 0) return 1;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  const scale = Math.min(scaleX, scaleY);

  // If allowScaleUp is false, don't scale beyond 1:1
  return allowScaleUp ? scale : Math.min(scale, 1);
}

export function applyModeToContainer(mode: Mode, container: HTMLElement) {
  container.setAttribute("data-canvas-mode", mode);
}


