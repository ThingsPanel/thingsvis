export * from "./store";
export * from "./safe-executor";
export * from "./etl-worker";

export { createKernelStore } from './store/KernelStore';
export type {
  KernelState,
  KernelStore,
  KernelActions,
  NodeState,
  ConnectionState,
  SelectionState,
  CanvasState,
  DataSourceRuntimeState,
  LayerGroup,
  GridState
} from './store/KernelStore';

// Export grid layout engine
export { GridSystem } from './grid/GridSystem';
export { GridLayoutError, type GridErrorCode } from './grid/errors';
export { detectCollision, findCollisions, resolveCollisions } from './grid/GridCollision';
export { compact, compactWithSort } from './grid/GridCompaction';
export type {
  GridItem,
  GridLayoutResult,
  GridDelta,
  GridPreviewResult,
  MigrationRecord,
  PixelRect,
} from './grid/types';

export { HistoryManager } from './history/HistoryManager';
export type { Command } from './history/HistoryManager';
export { safeExecute } from './executor/SafeExecutor';
export { ResourceLoader } from './loader/ResourceLoader';
export { UniversalLoader } from './loader/UniversalLoader';
export { CmdStack } from './history/CmdStack';
export { createNodeDropCommand } from './commands/nodeDrop';
export { action, subscribeToPatches } from './store';
export { actionStack } from './history/ActionStack';

// Export event bus
export { EventBus, type EventHandler, eventBus } from './event-bus';
import { eventBus as _eventBus } from './event-bus';
export * from './events/pluginEvents';
// expose kernel eventBus to host apps via globalThis for loose coupling (used by UI loader)
try {
  if (typeof globalThis !== 'undefined' && !(globalThis as any).__thingsvis_kernel_eventbus__) {
    (globalThis as any).__thingsvis_kernel_eventbus__ = _eventBus;
  }
} catch (e) { }

// expose subscribeToPatches for UI runtime via globalThis to avoid static package imports
try {
  const sub = require("./store").subscribeToPatches;
  if (sub && typeof globalThis !== "undefined") {
    (globalThis as any).__thingsvis_subscribeToPatches__ = sub;
  }
} catch (e) { }

// Export kernel interfaces
export { type IVisualComponent } from './interfaces/visual-component';
export { type IPluginFactory } from './interfaces/plugin-factory';

// Export DataSource Management
export { dataSourceManager, DataSourceManager } from './datasources/DataSourceManager';
export { BaseAdapter } from './datasources/BaseAdapter';
export { NoopSyncAdapter, ApiSyncAdapter } from './datasources/DataSourceSync';
export type { DataSourceSyncAdapter } from './datasources/DataSourceSync';
export { SafeExecutor } from './sandbox/SafeExecutor';

