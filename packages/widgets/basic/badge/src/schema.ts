import { z } from 'zod';

export const PropsSchema = z.object({
  text: z.string().default('在线').describe('Text'),
  tone: z.enum(['default', 'success', 'warning', 'danger', 'info']).default('success').describe('Tone'),
  shape: z.enum(['pill', 'rounded', 'square']).default('pill').describe('Shape'),
  fontSize: z.number().min(10).max(24).default(14).describe('Font size'),
  fontWeight: z.enum(['400', '500', '600', '700']).default('600').describe('Font weight'),
  paddingX: z.number().min(8).max(32).default(14).describe('Padding X'),
  borderWidth: z.number().min(0).max(6).default(1).describe('Border width'),
  backgroundColor: z.string().default('').describe('Background color'),
  textColor: z.string().default('').describe('Text color'),
  borderColor: z.string().default('').describe('Border color'),
  opacity: z.number().min(0).max(1).default(1).describe('Opacity'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
