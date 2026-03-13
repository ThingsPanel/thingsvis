import { z } from 'zod';

export const PropsSchema = z.object({
  // ── Content ────────────────────────────────────
  value: z.boolean().default(false).describe('props.switchStatus'),
  label: z.string().default('开关').describe('props.label'),
  showLabel: z.boolean().default(true).describe('props.showLabel'),
  labelPosition: z.enum(['left', 'right']).default('right').describe('props.labelPosition'),

  // ── On/Off appearance ──────────────────────────
  onLabel: z.string().default('').describe('props.onLabel'),
  offLabel: z.string().default('').describe('props.offLabel'),
  onColor: z.string().default('#22c55e').describe('props.activeColor'),
  offColor: z.string().default('#d1d5db').describe('props.inactiveColor'),

  // ── Size ───────────────────────────────────────
  size: z.enum(['default', 'small']).default('default').describe('props.size'),

  // ── State ──────────────────────────────────────
  disabled: z.boolean().default(false).describe('props.disabled'),
  loading: z.boolean().default(false).describe('props.loading'),

  // ── Behavior ───────────────────────────────────
  confirmToggle: z.boolean().default(false).describe('props.confirmToggle'),
  confirmMessage: z.string().default('确定要切换吗？').describe('props.confirmMessage'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
