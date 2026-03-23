import type { CSSProperties } from 'react';

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isExplicitBackgroundColor(value: string | undefined): value is string {
  return Boolean(value && value.toLowerCase() !== 'transparent');
}

export function normalizeCanvasBackgroundImageSource(source: string): string {
  const trimmed = source.trim();
  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('//') ||
    ABSOLUTE_URL_RE.test(trimmed)
  ) {
    return trimmed;
  }

  const base = (() => {
    if (typeof window === 'undefined') return undefined;

    const isEmbedded = typeof window.parent !== 'undefined' && window.parent !== window;
    if (isEmbedded && typeof document !== 'undefined' && document.referrer) {
      try {
        return new URL(document.referrer).origin;
      } catch {
        // Fall back to the current page URL below.
      }
    }

    return window.location.href;
  })();

  if (!base) return trimmed;

  try {
    return new URL(trimmed, base).toString();
  } catch {
    return trimmed;
  }
}

export function resolveCanvasBackgroundStyle(
  input: unknown,
): Pick<
  CSSProperties,
  | 'backgroundColor'
  | 'backgroundImage'
  | 'backgroundSize'
  | 'backgroundRepeat'
  | 'backgroundAttachment'
> {
  const background = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const color = normalizeString(background.color);
  const rawImage = normalizeString(background.image);
  const imageUrl = rawImage ? normalizeCanvasBackgroundImageSource(rawImage) : '';

  return {
    backgroundColor: isExplicitBackgroundColor(color)
      ? color
      : 'var(--w-bg, hsl(var(--w-canvas-bg, 0 0% 100%)))',
    backgroundImage: imageUrl
      ? `url(${imageUrl}), var(--w-artboard-gradient, none)`
      : 'var(--w-artboard-gradient, none)',
    backgroundSize: normalizeString(background.size) ?? 'cover',
    backgroundRepeat: normalizeString(background.repeat) ?? 'no-repeat',
    backgroundAttachment: normalizeString(background.attachment) ?? 'scroll',
  };
}
