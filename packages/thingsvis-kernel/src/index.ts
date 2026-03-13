/// <reference path="./globals.d.ts" />
export * from './store';
export * from './safe-executor';
export * from './etl-worker';

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
  GridState,
} from './store/KernelStore';

// Global variables system (TASK-23)
export type { DashboardVariable, VariableValueType, DashboardVariableList } from './variables';

// Action system (TASK-23)
export { executeActions } from './actions';
export type {
  ActionConfig,
  ActionContext,
  SetVariableAction,
  CallWriteAction,
  NavigateAction,
  RunScriptAction,
  ActionStore,
  ActionDataSourceManager,
} from './actions';

export { extractFieldSchema } from './utils/extractFieldSchema';
export type { FieldSchemaEntry } from './utils/extractFieldSchema';
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
export * from './events/widgetEvents';
// expose kernel eventBus to host apps via globalThis for loose coupling (used by UI loader)
try {
  if (typeof globalThis !== 'undefined' && !globalThis.__thingsvis_kernel_eventbus__) {
    globalThis.__thingsvis_kernel_eventbus__ = _eventBus;
  }
} catch (e) {
  console.warn('[kernel] Failed to expose eventBus on globalThis', e);
}

// expose subscribeToPatches for UI runtime via globalThis to avoid static package imports
try {
  const sub = require('./store').subscribeToPatches;
  if (sub && typeof globalThis !== 'undefined') {
    globalThis.__thingsvis_subscribeToPatches__ = sub;
  }
} catch (e) {
  console.warn('[kernel] Failed to expose subscribeToPatches on globalThis', e);
}

// Export kernel interfaces
export { type IVisualComponent } from './interfaces/visual-component';
export { type IWidgetFactory } from './interfaces/widget-factory';

// Export DataSource Management
export { dataSourceManager, DataSourceManager } from './datasources/DataSourceManager';
export { BaseAdapter } from './datasources/BaseAdapter';
export { PlatformFieldAdapter } from './datasources/PlatformFieldAdapter';
export type { WriteResult } from './datasources/BaseAdapter';
export { NoopSyncAdapter, ApiSyncAdapter } from './datasources/DataSourceSync';
export type { DataSourceSyncAdapter } from './datasources/DataSourceSync';
export { SafeExecutor } from './sandbox/SafeExecutor';
export { JsonPathResolver } from './datasources/JsonPathResolver';
export { FieldMappingExecutor } from './datasources/FieldMappingExecutor';
export { SandboxExecutor, runInSandbox } from './sandbox/SandboxExecutor';
export type { SandboxResult } from './sandbox/SandboxExecutor';
