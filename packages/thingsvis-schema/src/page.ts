import { z } from 'zod';
import { VisualComponentSchema } from './component';
import { GridSettingsSchema } from './grid';
import { CANVAS_THEME_IDS } from './theme-registry';

/**
 * Layout mode enum - includes grid mode
 */
export const LayoutModeSchema = z.enum(['fixed', 'infinite', 'reflow', 'grid']);
export type LayoutMode = z.infer<typeof LayoutModeSchema>;

export const PageBackgroundSchema = z.object({
  color: z.string().default('transparent'),
  image: z
    .string()
    .url()
    .refine((val) => !val.startsWith('data:image/'), { message: '严禁使用 base64 图片' })
    .optional()
    .or(z.literal('')),
  size: z.enum(['cover', 'contain', 'auto', '100% 100%']).default('cover'),
  repeat: z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y']).default('no-repeat'),
  attachment: z.enum(['scroll', 'fixed']).default('scroll'),
});

export const PageScaleModeSchema = z.enum([
  'fit-min',
  'fit-width',
  'fit-height',
  'stretch',
  'original',
]);

export const PagePreviewAlignYSchema = z.enum(['top', 'center']);

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
   * Visual theme preference (derived from CANVAS_THEMES registry)
   */
  theme: z.enum(CANVAS_THEME_IDS as [string, ...string[]]).default('dawn'),

  /**
   * Grid layout settings
   */
  gridSettings: GridSettingsSchema.optional(),

  /**
   * Global page background settings
   */
  background: PageBackgroundSchema.optional(),

  /**
   * Scale mode for preview
   */
  scaleMode: PageScaleModeSchema.optional(),

  /**
   * Vertical alignment for preview layout
   */
  previewAlignY: PagePreviewAlignYSchema.optional(),
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
