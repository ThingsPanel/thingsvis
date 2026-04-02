import { z } from 'zod';

const StateModeSchema = z.enum(['normal', 'running', 'warning', 'fault', 'offline']);

export const PropsSchema = z.object({
  selectedIconId: z.string().default('iot-device'),
  svgContent: z.string().default(''),
  /** Flat top-level key — avoids SDK shallow-merge losing nested state props. */
  stateMode: StateModeSchema.optional(),
  /** Flat top-level key — avoids SDK shallow-merge losing nested state props. */
  animateEnabled: z.boolean().default(false),
});

export type Props = z.infer<typeof PropsSchema>;
export type StateMode = z.infer<typeof StateModeSchema>;
