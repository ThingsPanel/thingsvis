import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('按钮').describe('props.label'),
  variant: z.enum(['filled', 'outline', 'ghost']).default('filled').describe('props.variant'),
  textColor: z.string().default('').describe('props.textColor'),
  borderRadius: z.number().min(0).max(50).default(6).describe('props.borderRadius'),
  disabled: z.boolean().default(false).describe('props.disabled'),
  fontSize: z.number().min(10).max(48).default(14).describe('props.fontSize'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
