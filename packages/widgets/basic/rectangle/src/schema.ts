import { z } from 'zod';

export const PropsSchema = z.object({
  fill: z.string().default('#dbeafe').describe('props.fillColor'),
  opacity: z.number().min(0).max(1).default(1).describe('props.opacityAlias'),
  blinkEnabled: z.boolean().default(false).describe('props.blinkEnabled'),
  blinkMinOpacity: z.number().min(0).max(1).default(0.35).describe('props.blinkMinOpacity'),
  blinkDurationMs: z.number().min(200).max(10000).default(900).describe('props.blinkDurationMs'),
  blinkAlternateFill: z.string().default('').describe('props.blinkAlternateFill'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
