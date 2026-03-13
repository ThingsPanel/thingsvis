import { z } from 'zod';

export const PropsSchema = z.object({
  label: z.string().default('下拉框').describe('props.label'),
  value: z.string().default('').describe('props.value'),
  options: z.string().default('[{"label":"选项 1","value":"1"},{"label":"选项 2","value":"2"}]').describe('props.options'),
  placeholder: z.string().default('请选择...').describe('props.placeholder'),
  backgroundColor: z.string().default('#1e293b').describe('props.bgColor'),
  textColor: z.string().default('#f1f5f9').describe('props.textColor'),
  borderColor: z.string().default('#334155').describe('props.borderColor'),
  borderRadius: z.number().min(0).max(50).default(6).describe('props.borderRadius'),
  disabled: z.boolean().default(false).describe('props.disabled'),
  fontSize: z.number().min(10).max(48).default(14).describe('props.fontSize'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
