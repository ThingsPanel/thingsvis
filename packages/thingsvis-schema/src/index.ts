export * from "./canvas-schema";
export * from "./contracts/canvas-contracts";

export type { PageSchemaType } from './page-schema';
export { NodeSchema } from './node-schema';
export type { NodeSchemaType } from './node-schema';

// Export page schemas and types
export {
  PageMetaSchema,
  PageConfigSchema,
  PageContentSchema,
  PageSchema,
  LayoutModeSchema,
  type LayoutMode,
  type IPageMeta,
  type IPageConfig,
  type IPageContent,
  type IPage,
} from './page';

// Export component schemas and types
export {
  ComponentIdentitySchema,
  ComponentTransformSchema,
  ComponentDataSchema,
  ComponentEventSchema,
  ComponentPropsSchema,
  VisualComponentSchema,
  type IComponentIdentity,
  type IComponentTransform,
  type IComponentData,
  type IComponentEvent,
  type IComponentProps,
  type IVisualComponent,
} from './component';

// Export grid schemas and types
export {
  GridSettingsSchema,
  BreakpointConfigSchema,
  GridPositionSchema,
  DEFAULT_BREAKPOINTS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_GRID_POSITION,
  type GridSettings,
  type BreakpointConfig,
  type GridPosition,
} from './grid';

// Export widget registry schemas and types (L1 widget layer)
export {
  ComponentRegistrySchema,
  ComponentRegistryEntrySchema,
  type ComponentRegistry,
  type ComponentRegistryEntry
} from './component-registry';

// Export widget remote module contract types (L1 widget layer)
export { type WidgetMainModule, type WidgetComponentId, type WidgetOverlayContext } from './widget-module';

// Export widget controls contract types/schemas (Studio dynamic panel)
export * from './widget-controls';

// Export datasource schemas and types
export * from './datasource/index';

