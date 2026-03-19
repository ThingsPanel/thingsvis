// NOTE: canvas-schema.ts is deprecated. Use page-schema.ts / node-schema.ts instead.
// export * from './canvas-schema';  // REMOVED — old schema types no longer exported
export * from './contracts/canvas-contracts';

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
  type ComponentRegistryEntry,
} from './component-registry';

// Export widget category enum and schema (唯一权威来源)
export { WIDGET_CATEGORIES, WidgetCategorySchema, type WidgetCategory } from './widget-category';

// Export widget remote module contract types (L1 widget layer)
export {
  type WidgetMainModule,
  type WidgetComponentId,
  type WidgetOverlayContext,
  type PluginOverlayInstance,
  type PluginPropSchema,
  type PluginSchema,
} from './widget-module';

// Export base style schema and types
export * from './style';

// Export widget controls contract types/schemas (Studio dynamic panel)
export * from './widget-controls';

// Export datasource schemas and types
export * from './datasource/index';
// DataSource v2 (exported separately to avoid circular import with datasource/index):
export * from './datasource/config-v2';
// Field mapping types
export * from './datasource/field-mapping';

// Export canvas theme registry
export * from './theme-registry';
