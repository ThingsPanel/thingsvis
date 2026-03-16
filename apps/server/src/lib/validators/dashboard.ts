import { z } from 'zod';

const DEFAULT_CANVAS_MODE = 'fixed' as const;
const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
const DEFAULT_CANVAS_BACKGROUND = '#1a1a2e';
const DEFAULT_CANVAS_THEME = 'dawn' as const;
const MAX_GRID_COLS = 48;
const LAYOUT_MODE_VALUES = ['fixed', 'infinite', 'reflow', 'grid'] as const;
const CANVAS_THEME_VALUES = ['dawn', 'midnight', 'ocean', 'ember', 'aurora'] as const;
const PREVIEW_SCALE_MODE_VALUES = [
  'fit-min',
  'fit-width',
  'fit-height',
  'stretch',
  'original',
] as const;
const PREVIEW_ALIGN_Y_VALUES = ['top', 'center'] as const;

export const LayoutModeSchema = z.enum(LAYOUT_MODE_VALUES);

export const CanvasBackgroundObjectSchema = z
  .object({
    color: z.string().optional(),
    image: z.string().optional(),
    size: z.string().optional(),
    repeat: z.string().optional(),
    attachment: z.string().optional(),
  })
  .passthrough();

export const CanvasBackgroundSchema = z.union([z.string(), CanvasBackgroundObjectSchema]);

// Shared persisted canvas contract for dashboard create/update payloads.
export const CanvasConfigSchema = z
  .object({
    mode: LayoutModeSchema.default(DEFAULT_CANVAS_MODE),
    width: z.number().int().positive().default(DEFAULT_CANVAS_WIDTH),
    height: z.number().int().positive().default(DEFAULT_CANVAS_HEIGHT),
    background: CanvasBackgroundSchema.default(DEFAULT_CANVAS_BACKGROUND),
    theme: z.enum(CANVAS_THEME_VALUES).default(DEFAULT_CANVAS_THEME),
    scaleMode: z.enum(PREVIEW_SCALE_MODE_VALUES).optional(),
    previewAlignY: z.enum(PREVIEW_ALIGN_Y_VALUES).optional(),
    gridCols: z.number().int().min(1).max(MAX_GRID_COLS).optional(),
    gridRowHeight: z.number().int().positive().optional(),
    gridGap: z.number().int().nonnegative().optional(),
    gridEnabled: z.boolean().optional(),
    gridSize: z.number().int().positive().optional(),
    fullWidthPreview: z.boolean().optional(),
    homeFlag: z.boolean().optional(),
  })
  .passthrough();

// Schema for creating a new dashboard
export const CreateDashboardSchema = z.object({
  name: z
    .string()
    .min(1, 'Dashboard name is required')
    .max(100, 'Dashboard name must be 100 characters or less'),
  id: z.string().optional(),
  projectId: z.string().optional(),
  canvasConfig: CanvasConfigSchema.optional(),
  thumbnail: z.string().optional(),
  variables: z.any().optional(), // Flexible JSON array
});

// Schema for updating a dashboard
export const UpdateDashboardSchema = z.object({
  name: z
    .string()
    .min(1, 'Dashboard name is required')
    .max(100, 'Dashboard name must be 100 characters or less')
    .optional(),
  canvasConfig: CanvasConfigSchema.optional(),
  nodes: z.any().optional(), // Flexible JSON array
  dataSources: z.any().optional(), // Flexible JSON array
  thumbnail: z.string().optional(), // Base64 or URL for thumbnail
  variables: z.any().optional(), // Flexible JSON array
});

// Default canvas configuration
export const DEFAULT_CANVAS_CONFIG = {
  mode: DEFAULT_CANVAS_MODE,
  width: DEFAULT_CANVAS_WIDTH,
  height: DEFAULT_CANVAS_HEIGHT,
  background: DEFAULT_CANVAS_BACKGROUND,
  theme: DEFAULT_CANVAS_THEME,
};

// TypeScript types derived from Zod schemas
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>;
export type CreateDashboardInput = z.infer<typeof CreateDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof UpdateDashboardSchema>;
