import type { CSSProperties } from 'react';

type Rgb = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const LIGHT_SURFACE_TEXT = '#0f172a';
const DARK_SURFACE_TEXT = '#f8fafc';
const TRANSPARENT_VALUES = new Set(['', 'transparent', 'none']);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function parseHexColor(color: string): Rgb | null {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;

  const raw = match[1] ?? '';
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((part) => part + part)
          .join('')
      : raw;
  const int = Number.parseInt(full.slice(0, 6), 16);
  const alpha = full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
    a: alpha,
  };
}

function parseRgbColor(color: string): Rgb | null {
  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;

  const parts = (match[1] ?? '').split(',').map((part) => part.trim());
  if (parts.length < 3) return null;

  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts[3] === undefined ? 1 : Number(parts[3]);
  if (![r, g, b, a].every(Number.isFinite)) return null;

  return {
    r: clamp(r, 0, 255),
    g: clamp(g, 0, 255),
    b: clamp(b, 0, 255),
    a: clamp(a, 0, 1),
  };
}

function parseColor(color: string | undefined): Rgb | null {
  const normalized = String(color ?? '').trim();
  if (TRANSPARENT_VALUES.has(normalized.toLowerCase())) return null;
  return parseHexColor(normalized) ?? parseRgbColor(normalized);
}

function compositeOverWhite(color: Rgb): Rgb {
  const alpha = color.a;
  return {
    r: color.r * alpha + 255 * (1 - alpha),
    g: color.g * alpha + 255 * (1 - alpha),
    b: color.b * alpha + 255 * (1 - alpha),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function withAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color;
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${clamp(alpha, 0, 1)})`;
}

export function resolveReadableWidgetTextColor(backgroundColor: string | undefined): string | null {
  const parsed = parseColor(backgroundColor);
  if (!parsed || parsed.a <= 0) return null;

  const effectiveBackground = compositeOverWhite(parsed);
  return relativeLuminance(effectiveBackground) > 0.45 ? LIGHT_SURFACE_TEXT : DARK_SURFACE_TEXT;
}

export function createWidgetThemeColorOverrideStyle(
  backgroundColor: string | undefined,
): CSSProperties {
  const readableText = resolveReadableWidgetTextColor(backgroundColor);
  if (!readableText) return {};

  return {
    '--w-bg': backgroundColor,
    '--w-fg': readableText,
    '--w-axis': withAlpha(readableText, 0.14),
    '--w-border': withAlpha(readableText, 0.12),
  } as CSSProperties;
}

export function syncWidgetThemeColorOverrides(
  element: HTMLElement,
  backgroundColor: string | undefined,
): void {
  const overrides = createWidgetThemeColorOverrideStyle(backgroundColor) as Record<string, string>;
  const names = ['--w-bg', '--w-fg', '--w-axis', '--w-border'];

  names.forEach((name) => {
    const value = overrides[name];
    if (value) {
      element.style.setProperty(name, value);
    } else {
      element.style.removeProperty(name);
    }
  });
}
