import { createRuntimeServices } from '@thingsvis/kernel';

export const runtime = createRuntimeServices();
export const store = runtime.store;
export const dataSourceManager = runtime.dataSourceManager;
export const loader = runtime.loader;
export const eventBus = runtime.eventBus;
export const subscribeToPatches = runtime.subscribeToPatches;
export const actionRuntime = {
  dataSourceManager,
};
