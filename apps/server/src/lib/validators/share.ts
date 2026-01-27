import { z } from 'zod'

// Schema for share link options when generating a share link
export const ShareOptionsSchema = z.object({
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  expiresIn: z
    .number()
    .int()
    .min(3600, 'Expiration must be at least 1 hour (3600 seconds)')
    .max(2592000, 'Expiration cannot exceed 30 days (2592000 seconds)')
    .optional(),
})

// TypeScript types derived from Zod schemas
export type ShareOptions = z.infer<typeof ShareOptionsSchema>

// ShareConfig stored in database (JSON string)
export interface ShareConfig {
  password?: string // bcrypt-hashed password
  expiresAt?: string // ISO 8601 timestamp (UTC)
}
