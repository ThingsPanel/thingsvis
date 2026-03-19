import { DataSourceManager } from './datasources/DataSourceManager';
import { EventBus } from './event-bus';
import { Loader } from './loader/UniversalLoader';
import { createKernelStore, type KernelStore } from './store/KernelStore';
import { createStorePatchBridge, type SubscribeToPatches } from './store/patchBridge';

export interface RuntimeServices {
  store: KernelStore;
  eventBus: EventBus;
  dataSourceManager: DataSourceManager;
  loader: Loader;
  subscribeToPatches: SubscribeToPatches;
}

export interface RuntimeServicesOptions {
  store?: KernelStore;
  eventBus?: EventBus;
  dataSourceManager?: DataSourceManager;
  loader?: Loader;
}

export function createRuntimeServices(options: RuntimeServicesOptions = {}): RuntimeServices {
  const store = options.store ?? createKernelStore();
  const eventBus = options.eventBus ?? new EventBus();
  const dataSourceManager = options.dataSourceManager ?? new DataSourceManager();
  const loader = options.loader ?? new Loader();
  const { subscribeToPatches } = createStorePatchBridge(store);

  void dataSourceManager.init(store);

  return {
    store,
    eventBus,
    dataSourceManager,
    loader,
    subscribeToPatches,
  };
}
