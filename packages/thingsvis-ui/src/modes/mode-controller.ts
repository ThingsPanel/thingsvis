export type Mode = "Fixed" | "Infinite" | "Reflow";

export function normalizeMode(input: string | Mode): Mode {
  if (input === "Infinite") return "Infinite";
  if (input === "Reflow") return "Reflow";
  return "Fixed";
}

export function applyModeToContainer(mode: Mode, container: HTMLElement) {
  // For MVP: apply data-mode attribute for styling/consumers
  container.setAttribute("data-canvas-mode", mode);
}


