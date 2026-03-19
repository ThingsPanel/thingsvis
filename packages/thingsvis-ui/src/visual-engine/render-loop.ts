let rafId: number | null = null;

export function startRenderLoop(
  onFrame: (patches: unknown[]) => void,
  subscribeToPatches?: (cb: (patches: unknown[]) => void) => () => void,
) {
  let pendingPatches: unknown[] = [];
  if (!subscribeToPatches) return () => {};
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

