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
  accessToken: z.string().default('').describe('props.accessToken'),
  deviceSerial: z.string().default('').describe('props.deviceSerial'),
  channelNo: z.coerce.number().int().min(1).max(32).default(1).describe('props.channelNo'),
  hd: z.boolean().default(true).describe('props.hd'),
  /** Cloud recording space id — fill directly in widget props, not from telemetry. */
  spaceId: z.string().default('361254').describe('props.spaceId'),
  busType: z.string().default('7').describe('props.busType'),
  /** Optional hint URL to parse begin/end/spaceId/busType (not used for live). */
  playbackParamsUrl: z.string().default('').describe('props.playbackParamsUrl'),
  playbackEnd: z.string().default('').describe('props.playbackEnd'),
  /** Optional legacy fallback when serial/channel are not bound. */
  ezopenUrl: z.string().default('').describe('props.ezopenUrl'),
  validCode: z.string().default('').describe('props.validCode'),
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
