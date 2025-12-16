export type { IPage as PageSchemaType } from './page';
export { NodeSchema } from './node-schema';
export type { NodeSchemaType } from './node-schema';

// Export page schemas and types
export {
  PageMetaSchema,
  PageConfigSchema,
  PageContentSchema,
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

