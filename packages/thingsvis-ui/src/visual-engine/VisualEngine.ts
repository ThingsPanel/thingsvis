import type { CanvasNode, CanvasPage } from '@thingsvis/schema';
import { subscribeToPatches } from '@thingsvis/kernel';
import { startRenderLoop } from "./render-loop";
import { LeaferAdapter } from "../visual/leaferAdapter";

export class VisualEngine {
  private running = false;
  private stopLoop?: () => void;
  private adapter?: LeaferAdapter;

  constructor(private pageId: string) {}

  start(containerEl?: HTMLDivElement) {
    if (this.running) return;
    this.running = true;
    // Initialize visual adapter (Leafer)
    this.adapter = new LeaferAdapter();
    if (containerEl) {
      this.adapter.init(containerEl);
    }

    this.stopLoop = startRenderLoop((patches) => {
      // For MVP, forward basic patches to adapter (real mapping later)
      // eslint-disable-next-line no-console
      console.log("[VisualEngine] onFrame patches:", patches.length);
      // TODO: translate patches into adapter.addNode/update/removeNode calls
    });
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.stopLoop) this.stopLoop();
  }
}


