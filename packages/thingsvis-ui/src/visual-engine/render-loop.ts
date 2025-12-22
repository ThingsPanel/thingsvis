let rafId: number | null = null;

function getSubscribeToPatches(): ((cb: (patches: any[]) => void) => () => void) | null {
  try {
    const fn = (globalThis as any).__thingsvis_subscribeToPatches__;
    if (typeof fn === "function") return fn;
  } catch {}
  return null;
}

export function startRenderLoop(onFrame: (patches: any[]) => void) {
  let pendingPatches: any[] = [];
  const subscribe = getSubscribeToPatches();
  if (!subscribe) return () => {};
  const unsub = subscribe((patches) => {
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


