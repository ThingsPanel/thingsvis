let rafId: number | null = null;

function getSubscribeToPatches(): ((cb: (patches: unknown[]) => void) => () => void) | null {
  try {
    const fn = (globalThis as Record<string, unknown>).__thingsvis_subscribeToPatches__;
    if (typeof fn === "function") return fn as (cb: (patches: unknown[]) => void) => () => void;
  } catch { /* globalThis lookup may fail in restricted environments */ }
  return null;
}

export function startRenderLoop(onFrame: (patches: unknown[]) => void) {
  let pendingPatches: unknown[] = [];
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


