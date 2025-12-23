export type Mode = "fixed" | "infinite" | "reflow";

export function normalizeMode(input: string | Mode): Mode {
  const normalized = input.toLowerCase();
  if (normalized === "infinite") return "infinite";
  if (normalized === "reflow") return "reflow";
  return "fixed";
}

export function calculateScaleToFit(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
  padding = 0
): number {
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2;
  
  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  
  return Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1:1 by default
}

export function applyModeToContainer(mode: Mode, container: HTMLElement) {
  container.setAttribute("data-canvas-mode", mode);
}


