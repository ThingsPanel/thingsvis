import { z } from 'zod';
import { GridPositionSchema } from './grid';
import { BaseStyleSchema } from './style';

/**
 * Component identity schema
 * Contains identification and visibility information for a component
 */
export const ComponentIdentitySchema = z.object({
  /**
   * Unique identifier for the component (UUID v4)
   */
  id: z.string().uuid(),

  /**
   * Component type identifier (e.g., 'echarts-bar', 'custom-widget')
   */
  type: z.string().min(1),

  /**
   * Human-readable component name
   */
  name: z.string().min(1),

  /**
   * Whether component is locked from editing (defaults to false)
   */
  locked: z.boolean().default(false),

  /**
   * Whether component is hidden from display (defaults to false)
   */
  hidden: z.boolean().default(false),
});

/**
 * Component transform schema
 * Contains spatial positioning and sizing information
 */
export const ComponentTransformSchema = z.object({
  /**
   * X position in pixels
   */
  x: z.number(),

  /**
   * Y position in pixels
   */
  y: z.number(),

  /**
   * Component width in pixels
   */
  width: z.number(),

  /**
   * Component height in pixels
   */
  height: z.number(),

  /**
   * Rotation in degrees (defaults to 0)
   */
  rotation: z.number().default(0),
});

/**
 * Component data schema
 * Contains data source binding configuration
 */
export const ComponentDataSchema = z.object({
  /**
   * Data source identifier
   */
  sourceId: z.string().min(1),

  /**
   * Data topic/subscription identifier
   */
  topic: z.string().min(1),

  /**
   * Transform script as string (can be empty)
   */
  transform: z.string(),
});

/**
 * Component event schema
 * Defines a single event handler
 */
export const ComponentEventSchema = z.object({
  /**
   * Event trigger identifier
   */
  trigger: z.string(),

  /**
   * Action to execute
   */
  action: z.string(),

  /**
   * Action payload data
   */
  payload: z.unknown(),
});

/**
 * Component props schema
 * Flexible key-value pairs for component-specific configuration
 */
export const ComponentPropsSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Complete visual component schema
 * Combines identity, transform, data, props, and events
 */
export const VisualComponentSchema = z.object({
  identity: ComponentIdentitySchema,
  transform: ComponentTransformSchema,
  data: ComponentDataSchema,
  props: ComponentPropsSchema,
  baseStyle: BaseStyleSchema.optional(),
  events: z.array(ComponentEventSchema).default([]),
  /**
   * Grid position (optional, only used in grid mode)
   * When present and page is in grid mode, this is the source of truth
   * The transform values are derived from grid position for rendering
   */
  grid: GridPositionSchema.optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type IComponentIdentity = z.infer<typeof ComponentIdentitySchema>;
export type IComponentTransform = z.infer<typeof ComponentTransformSchema>;
export type IComponentData = z.infer<typeof ComponentDataSchema>;
export type IComponentEvent = z.infer<typeof ComponentEventSchema>;
export type IComponentProps = z.infer<typeof ComponentPropsSchema>;
export type IVisualComponent = z.infer<typeof VisualComponentSchema>;
