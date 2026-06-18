import { z } from "zod";

const CURRENT_PRESETS = ["clear", "frosted", "dense"] as const;
const LEGACY_PRESETS = [
  "crystal-white",
  "crystal-blue",
  "crystal-purple",
  "frost-white",
  "frost-warm",
  "minimal-white",
  "solid-white",
  "custom"
] as const;

export const PropsSchema = z.object({
  preset: z.enum([...CURRENT_PRESETS, ...LEGACY_PRESETS]).default("frosted").describe("props.preset"),
  blur: z.number().min(0).max(40).optional().describe("props.blur"),
  fillOpacity: z.number().min(0).max(1).optional().describe("props.fillOpacity"),
  tintColor: z.string().optional().describe("props.tintColor"),
  tintStrength: z.number().min(0).max(1).optional().describe("props.tintStrength"),
  highlight: z.number().min(0).max(1).optional().describe("props.highlight"),
  noise: z.number().min(0).max(0.12).optional().describe("props.noise"),

  // Legacy fields kept for saved dashboards. They are not exposed in controls.
  styleMode: z.enum(["glass", "flat", "line"]).optional(),
  blurOffset: z.number().min(-20).max(20).optional(),
  opacityOffset: z.number().min(-0.5).max(0.5).optional(),
  highlightOffset: z.number().min(-0.5).max(0.5).optional(),
  tintOffset: z.number().min(-0.5).max(0.5).optional()
});

export type Props = z.infer<typeof PropsSchema>;
export type CurrentPreset = (typeof CURRENT_PRESETS)[number];

export interface GlassValues {
  blur: number;
  fillOpacity: number;
  tintColor: string;
  tintStrength: number;
  highlight: number;
  noise: number;
}

export const GLASS_PRESETS: Record<CurrentPreset, GlassValues> = {
  clear: {
    blur: 22,
    fillOpacity: 0.08,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.34,
    noise: 0.015
  },
  frosted: {
    blur: 18,
    fillOpacity: 0.16,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.28,
    noise: 0.025
  },
  dense: {
    blur: 14,
    fillOpacity: 0.32,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.22,
    noise: 0.035
  }
};

const LEGACY_PRESET_VALUES: Record<(typeof LEGACY_PRESETS)[number], GlassValues> = {
  "crystal-white": {
    blur: 32,
    fillOpacity: 0.06,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.48,
    noise: 0.02
  },
  "crystal-blue": {
    blur: 32,
    fillOpacity: 0.06,
    tintColor: "#60a5fa",
    tintStrength: 0.55,
    highlight: 0.48,
    noise: 0.02
  },
  "crystal-purple": {
    blur: 32,
    fillOpacity: 0.06,
    tintColor: "#a78bfa",
    tintStrength: 0.5,
    highlight: 0.48,
    noise: 0.02
  },
  "frost-white": {
    blur: 24,
    fillOpacity: 0.15,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.35,
    noise: 0.04
  },
  "frost-warm": {
    blur: 24,
    fillOpacity: 0.15,
    tintColor: "#fdba74",
    tintStrength: 0.48,
    highlight: 0.35,
    noise: 0.04
  },
  "minimal-white": {
    blur: 20,
    fillOpacity: 0.02,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.28,
    noise: 0.01
  },
  "solid-white": {
    blur: 12,
    fillOpacity: 0.72,
    tintColor: "#ffffff",
    tintStrength: 0,
    highlight: 0.18,
    noise: 0.04
  },
  custom: {
    blur: 24,
    fillOpacity: 0.15,
    tintColor: "#60a5fa",
    tintStrength: 0,
    highlight: 0.35,
    noise: 0.04
  }
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function isCurrentPreset(value: Props["preset"]): value is CurrentPreset {
  return CURRENT_PRESETS.includes(value as CurrentPreset);
}

export function resolveGlassValues(props: Props): GlassValues {
  if (isCurrentPreset(props.preset)) {
    const base = GLASS_PRESETS[props.preset];
    return {
      blur: clamp(props.blur ?? base.blur, 0, 40),
      fillOpacity: clamp(props.fillOpacity ?? base.fillOpacity, 0, 1),
      tintColor: props.tintColor || base.tintColor,
      tintStrength: clamp(props.tintStrength ?? base.tintStrength, 0, 1),
      highlight: clamp(props.highlight ?? base.highlight, 0, 1),
      noise: clamp(props.noise ?? base.noise, 0, 0.12)
    };
  }

  const legacy = LEGACY_PRESET_VALUES[props.preset] ?? GLASS_PRESETS.frosted;
  return {
    blur: clamp(legacy.blur + (props.blurOffset ?? 0), 0, 40),
    fillOpacity: clamp(legacy.fillOpacity + (props.opacityOffset ?? 0), 0, 1),
    tintColor: legacy.tintColor,
    tintStrength: clamp(legacy.tintStrength + (props.tintOffset ?? 0), 0, 1),
    highlight: clamp(legacy.highlight + (props.highlightOffset ?? 0), 0, 1),
    noise: clamp(legacy.noise, 0, 0.12)
  };
}

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
