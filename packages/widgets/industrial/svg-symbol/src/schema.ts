import { z } from 'zod';

export const PropsSchema = z.object({
  /**
   * ID of the selected industrial symbol from the built-in registry.
   * Defaults to control cabinet as a generic industrial equipment symbol.
   */
  selectedIconId: z.string().default('heat-exchanger'),

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
