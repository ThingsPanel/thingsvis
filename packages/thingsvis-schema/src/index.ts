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

// Export plugin registry schemas and types (L1 plugin layer)
export {
  ComponentRegistrySchema,
  ComponentRegistryEntrySchema,
  type ComponentRegistry,
  type ComponentRegistryEntry
} from './component-registry';

// Export plugin remote module contract types (L1 plugin layer)
export { type PluginMainModule, type PluginComponentId } from './plugin-module';

// Export datasource schemas and types
export * from './datasource/index';

