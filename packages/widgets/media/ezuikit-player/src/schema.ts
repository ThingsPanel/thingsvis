import { z } from 'zod';

export const TemplateSchema = z.enum([
  'simple',
  'standard',
  'security',
  'pcLive',
  'mobileLive',
  'voice',
  'theme',
]);

export const PropsSchema = z.object({
  title: z.string().default('EZVIZ').describe('props.title'),
  showTitle: z.boolean().default(false).describe('props.showTitle'),
  accessToken: z.string().default('').describe('props.accessToken'),
  ezopenUrl: z.string().default('').describe('props.ezopenUrl'),
  deviceSerial: z.string().default('').describe('props.deviceSerial'),
  channelNo: z.number().min(1).max(32).default(1).describe('props.channelNo'),
  validCode: z.string().default('').describe('props.validCode'),
  streamSuffix: z.enum(['live', 'rec']).default('live').describe('props.streamSuffix'),
  playbackBegin: z.string().default('').describe('props.playbackBegin'),
  playbackEnd: z.string().default('').describe('props.playbackEnd'),
  template: TemplateSchema.default('security').describe('props.template'),
  themeId: z.string().default('').describe('props.themeId'),
  autoplay: z.boolean().default(true).describe('props.autoplay'),
  audio: z.boolean().default(false).describe('props.audio'),
  domain: z.string().default('https://open.ys7.com').describe('props.domain'),
  borderRadius: z.number().min(0).max(48).default(6).describe('props.borderRadius'),
  borderWidth: z.number().min(0).max(12).default(0).describe('props.borderWidth'),
  borderColor: z.string().default('#111827').describe('props.borderColor'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
