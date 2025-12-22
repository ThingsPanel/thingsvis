import type { CanvasNode, CanvasPage } from "@thingsvis/schema/contracts/canvas-contracts";
import { subscribeToPatches } from "../../../thingsvis-kernel/src/store";

export class VisualEngine {
  private running = false;
  private unsub?: () => void;

  constructor(private pageId: string) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.unsub = subscribeToPatches((patches) => {
      // For MVP, simply log patches — real engine applies to leafer/three instances
      // eslint-disable-next-line no-console
      console.log("[VisualEngine] patches:", patches.length);
    });
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.unsub) this.unsub();
  }
}


