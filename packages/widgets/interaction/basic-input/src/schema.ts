import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('').describe('props.label'),
  placeholder: z.string().default('请输入...').describe('props.placeholder'),
  inputType: z.enum(['text', 'number', 'password']).default('text').describe('props.inputType'),
  value: z.string().default('').describe('props.value'),
  submitOn: z.enum(['enter', 'blur', 'both']).default('both').describe('props.submitOn'),
  disabled: z.boolean().default(false).describe('props.disabled'),
  textColor: z.string().default('').describe('props.textColor'),
  borderColor: z.string().default('').describe('props.borderColor'),
  accentColor: z.string().default('').describe('props.accentColor'),
  fontSize: z.number().min(10).max(48).default(14).describe('props.fontSize'),
  borderRadius: z.number().min(0).max(24).default(6).describe('props.borderRadius'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
