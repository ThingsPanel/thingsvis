import { createRuntimeServices } from '@thingsvis/kernel';

export const runtime = createRuntimeServices();
export const store = runtime.store;
export const dataSourceManager = runtime.dataSourceManager;
export const loader = runtime.loader;
export const eventBus = runtime.eventBus;
export const subscribeToPatches = runtime.subscribeToPatches;

// Frozen to guarantee a stable reference across HMR cycles.
// GridNodeItem uses this in useEffect deps — an unstable ref causes
// repeated unmount/remount and breaks baseStyle application.
export const actionRuntime: { dataSourceManager: typeof dataSourceManager } = Object.freeze({
  dataSourceManager,
});
