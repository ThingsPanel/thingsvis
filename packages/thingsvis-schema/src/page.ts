import { z } from 'zod';
import { VisualComponentSchema } from './component';
import { GridSettingsSchema } from './grid';

/**
 * Layout mode enum - includes grid mode
 */
export const LayoutModeSchema = z.enum(['fixed', 'infinite', 'reflow', 'grid']);
export type LayoutMode = z.infer<typeof LayoutModeSchema>;

/**
 * Page metadata schema
 * Contains identification and versioning information for a page
 */
export const PageMetaSchema = z.object({
  /**
   * Unique identifier for the page (UUID v4)
   */
  id: z.string().uuid(),

  /**
   * Schema version for compatibility (defaults to "1.0.0")
   */
  version: z.string().default('1.0.0'),

  /**
   * Human-readable page name
   */
  name: z.string().min(1),

  /**
   * Page scope classification
   */
  scope: z.enum(['app', 'template']),
});

/**
 * Page configuration schema
 * Contains display settings and layout configuration
 */
export const PageConfigSchema = z.object({
  /**
   * Page layout mode
   * - 'fixed': Fixed canvas size, centered
   * - 'infinite': Infinite canvas with pan/zoom
   * - 'reflow': Responsive reflow layout
   * - 'grid': Gridstack-style grid layout
   */
  mode: LayoutModeSchema,

  /**
   * Page width in pixels (defaults to 1920)
   * For grid mode: defines the design-time reference width
   */
  width: z.number().int().positive().default(1920),

  /**
   * Page height in pixels (defaults to 1080)
   * For grid mode: minimum height, expands with content
   */
  height: z.number().int().positive().default(1080),

  /**
   * Visual theme preference
   */
  theme: z.enum(['dawn', 'midnight', 'dark', 'light', 'auto']),

  /**
   * Grid layout settings (only used when mode === 'grid')
   */
  gridSettings: GridSettingsSchema.optional(),
});

/**
 * Page content schema
 * Contains the visual components on the page
 */
export const PageContentSchema = z.object({
  /**
   * Array of visual components on the page
   * Can be empty array
   */
  nodes: z.array(VisualComponentSchema).default([]),
});

/**
 * Complete page schema
 * Combines metadata, configuration, and content
 */
export const PageSchema = z.object({
  meta: PageMetaSchema,
  config: PageConfigSchema,
  content: PageContentSchema,
});

/**
 * TypeScript types inferred from schemas
 */
export type IPageMeta = z.infer<typeof PageMetaSchema>;
export type IPageConfig = z.infer<typeof PageConfigSchema>;
export type IPageContent = z.infer<typeof PageContentSchema>;
export type IPage = z.infer<typeof PageSchema>;

