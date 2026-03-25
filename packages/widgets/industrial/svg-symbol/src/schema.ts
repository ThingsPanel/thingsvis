import { z } from 'zod';

export const PropsSchema = z.object({
  svgContent: z
    .string()
    .default(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">\n  <rect id="bg" width="100%" height="100%" fill="#292929" rx="10" />\n  <circle id="core" cx="100" cy="100" r="50" fill="#4caf50" />\n  <text id="label" x="100" y="105" font-family="Arial" font-size="20" fill="white" text-anchor="middle">SVG</text>\n</svg>',
    ),
  fillSettings: z.record(z.string()).optional(),
});

export type Props = z.infer<typeof PropsSchema>;
