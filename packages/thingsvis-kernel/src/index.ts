export * from './store';
export * from './safe-executor';
export * from './etl-worker';
export { createRuntimeServices } from './RuntimeServices';
export type { RuntimeServices, RuntimeServicesOptions } from './RuntimeServices';
export type { RuntimePatch, SubscribeToPatches } from './store/patchBridge';

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
export { Loader, getLegacyLoader } from './loader/UniversalLoader';
export { CmdStack } from './history/CmdStack';
export { createNodeDropCommand } from './commands/nodeDrop';
export { action, subscribeToPatches } from './store';
export { actionStack } from './history/ActionStack';

// Export event bus
export { EventBus, type EventHandler, eventBus } from './event-bus';
export * from './events/widgetEvents';

// Legacy kernel interfaces — no longer on the main code path.
// Kept as internal files for reference; removed from public exports.
// See: issues/07-widget-contract-registry-runtime-fragmentation-architecture-debt.md

// Export DataSource Management
export { getLegacyDataSourceManager, DataSourceManager } from './datasources/DataSourceManager';
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
