import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be 255 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name must be 255 characters or less').optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
