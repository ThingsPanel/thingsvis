import { z } from 'zod';

const DEFAULT_TITLE_FONT_SIZE = 14;
const DEFAULT_VALUE_FONT_SIZE = 32;
const DEFAULT_SUFFIX_FONT_SIZE = 14;
const DEFAULT_SUBTITLE_FONT_SIZE = 12;

export const PropsSchema = z.object({
  // Data Settings
  title: z.string().default('总览数值').describe('props.title'),
  value: z.union([z.number().default(0), z.string(), z.null()]).default(128450).describe('props.value'),
  suffix: z.string().default('元').describe('props.suffix'),
  subtitle: z.string().default('较上月').describe('props.subtitle'),
  precision: z.number().int().min(0).max(6).default(0).describe('props.precision'),

  // Icon Settings
  icon: z.string().default('').describe('props.icon'),
  iconSize: z.number().int().min(12).max(100).default(24).describe('props.iconSize'),
  iconOpacity: z.number().min(0).max(1).default(0.8).describe('props.iconOpacity'),

  // Typography Settings
  titleFontSize: z.number().int().min(10).max(100).default(DEFAULT_TITLE_FONT_SIZE).describe('props.titleFontSize'),
  valueFontSize: z.number().int().min(12).max(200).default(DEFAULT_VALUE_FONT_SIZE).describe('props.valueFontSize'),
  suffixFontSize: z.number().int().min(10).max(100).default(DEFAULT_SUFFIX_FONT_SIZE).describe('props.suffixFontSize'),
  subtitleFontSize: z.number().int().min(10).max(100).default(DEFAULT_SUBTITLE_FONT_SIZE).describe('props.subtitleFontSize'),

  // Layout Settings
  align: z.enum(['left', 'center', 'right']).default('left').describe('props.align'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
