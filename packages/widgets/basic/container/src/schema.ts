import { z } from 'zod';

export const PropsSchema = z.object({
  fillColor: z.string().default('#ffffff').describe('props.fillColor'),
  containerOpacity: z.number().min(0).max(1).default(0.06).describe('props.containerOpacity'),
  containerBorderColor: z.string().default('rgba(148, 163, 184, 0.35)').describe('props.containerBorderColor'),
  containerBorderWidth: z.number().min(0).max(12).default(1).describe('props.containerBorderWidth'),
  cornerRadius: z.number().min(0).max(32).default(8).describe('props.cornerRadius'),
  contentPadding: z.number().min(0).max(64).default(12).describe('props.contentPadding'),
  shadowEnabled: z.boolean().default(false).describe('props.shadowEnabled'),
  shadowColor: z.string().default('rgba(15, 23, 42, 0.16)').describe('props.shadowColor'),
  shadowBlur: z.number().min(0).max(80).default(18).describe('props.shadowBlur'),
  shadowOffsetY: z.number().min(-40).max(40).default(8).describe('props.shadowOffsetY'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
