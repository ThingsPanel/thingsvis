import { z } from 'zod'

// Canvas configuration schema
export const CanvasConfigSchema = z.object({
  mode: z.enum(['fixed', 'infinite', 'reflow']).default('fixed'),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  background: z.string().default('#1a1a2e'),
})

// Schema for creating a new dashboard
export const CreateDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(100, 'Dashboard name must be 100 characters or less'),
  projectId: z.string().cuid('Invalid project ID'),
  canvasConfig: CanvasConfigSchema.optional(),
})

// Schema for updating a dashboard
export const UpdateDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required').max(100, 'Dashboard name must be 100 characters or less').optional(),
  canvasConfig: z.any().optional(), // Flexible JSON object
  nodes: z.any().optional(), // Flexible JSON array
  dataSources: z.any().optional(), // Flexible JSON array
  thumbnail: z.string().optional(), // Base64 or URL for thumbnail
})

// Default canvas configuration
export const DEFAULT_CANVAS_CONFIG = {
  mode: 'fixed' as const,
  width: 1920,
  height: 1080,
  background: '#1a1a2e',
}

// TypeScript types derived from Zod schemas
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>
export type CreateDashboardInput = z.infer<typeof CreateDashboardSchema>
export type UpdateDashboardInput = z.infer<typeof UpdateDashboardSchema>
