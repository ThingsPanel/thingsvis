import { z } from 'zod';

export const PropsSchema = z.object({
  value: z.boolean().default(false).describe('props.value'),
  onLabel: z.string().default('开').describe('props.onLabel'),
  offLabel: z.string().default('关').describe('props.offLabel'),
  onColor: z.string().default('').describe('props.onColor'),
  offColor: z.string().default('').describe('props.offColor'),
  onTextColor: z.string().default('').describe('props.onTextColor'),
  offTextColor: z.string().default('').describe('props.offTextColor'),
  fontSize: z.number().min(10).max(48).default(14).describe('props.fontSize'),
  borderRadius: z.number().min(0).max(50).default(6).describe('props.borderRadius'),
  disabled: z.boolean().default(false).describe('props.disabled'),
  confirmToggle: z.boolean().default(false).describe('props.confirmToggle'),
  confirmMessage: z.string().default('确定要切换吗？').describe('props.confirmMessage'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
