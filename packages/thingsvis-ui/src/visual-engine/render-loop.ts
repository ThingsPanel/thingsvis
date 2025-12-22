import { subscribeToPatches } from "@thingsvis/kernel/store";

let rafId: number | null = null;

export function startRenderLoop(onFrame: (patches: any[]) => void) {
  let pendingPatches: any[] = [];
  const unsub = subscribeToPatches((patches) => {
    pendingPatches = pendingPatches.concat(patches);
  });

  function frame() {
    if (pendingPatches.length > 0) {
      onFrame(pendingPatches);
      pendingPatches = [];
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    unsub();
  };
}


