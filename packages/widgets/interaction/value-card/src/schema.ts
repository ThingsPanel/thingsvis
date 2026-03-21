import { z } from 'zod';

const DEFAULT_TITLE_FONT_SIZE = 14;
const DEFAULT_VALUE_FONT_SIZE = 32;
const DEFAULT_SUFFIX_FONT_SIZE = 14;
const DEFAULT_SUBTITLE_FONT_SIZE = 12;

export const PropsSchema = z.object({
  // Data Settings
  title: z.string().default('总览数值').describe('props.title'),
  prefix: z.string().default('').describe('props.prefix'),
  value: z.union([z.number().default(0), z.string(), z.null()]).default(0).describe('props.value'),
  suffix: z.string().default('元').describe('props.suffix'),
  subtitle: z.string().default('较上月').describe('props.subtitle'),
  trend: z.number().default(0).describe('props.trend'),
  precision: z.number().int().min(0).max(6).default(0).describe('props.precision'),

  // Icon Settings
  icon: z.string().default('').describe('props.icon'),
  iconSize: z.number().int().min(12).max(100).default(24).describe('props.iconSize'),

  // Typography Settings
  titleFontSize: z.number().int().min(10).max(100).default(DEFAULT_TITLE_FONT_SIZE).describe('props.titleFontSize'),
  valueFontSize: z.number().int().min(12).max(200).default(DEFAULT_VALUE_FONT_SIZE).describe('props.valueFontSize'),
  suffixFontSize: z.number().int().min(10).max(100).default(DEFAULT_SUFFIX_FONT_SIZE).describe('props.suffixFontSize'),
  subtitleFontSize: z.number().int().min(10).max(100).default(DEFAULT_SUBTITLE_FONT_SIZE).describe('props.subtitleFontSize'),

  // Color Settings
  titleColor: z.string().default('').describe('props.titleColor'),
  valueColor: z.string().default('').describe('props.valueColor'),
  subtitleColor: z.string().default('').describe('props.subtitleColor'),
  iconColor: z.string().default('').describe('props.iconColor'),
  iconBackgroundColor: z.string().default('').describe('props.iconBackgroundColor'),
  trendUpColor: z.string().default('').describe('props.trendUpColor'),
  trendDownColor: z.string().default('').describe('props.trendDownColor'),

  // Layout Settings
  align: z.enum(['left', 'center', 'right']).default('left').describe('props.align'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
