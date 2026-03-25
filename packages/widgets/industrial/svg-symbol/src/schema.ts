import { z } from 'zod';

export const PropsSchema = z.object({
  /**
   * ID of the selected industrial symbol from the built-in registry.
   * Defaults to the first entry (centrifugal pump) so the widget renders
   * something meaningful immediately after dropping onto the canvas.
   */
  selectedIconId: z.string().default('pump-centrifugal'),

  /**
   * Raw SVG fallback / custom paste.
   * Used only when selectedIconId is empty.
   */
  svgContent: z.string().default(''),

  /**
   * Optional accent color override.
   * If set, replaces the primary fill color in the rendered SVG.
   * Leave empty to preserve original SVG colors.
   */
  iconColor: z.string().default(''),
});

export type Props = z.infer<typeof PropsSchema>;
