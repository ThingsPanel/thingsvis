import type { IPageConfig } from '@thingsvis/schema';
import { apiClient } from './api/client';

export type ExplicitCanvasBackground = NonNullable<IPageConfig['background']>;

export interface CanvasBackgroundState {
  background?: ExplicitCanvasBackground;
  bgType: 'color' | 'image';
  bgValue: string;
  bgColor: string;
  bgImage: string;
}

const BACKGROUND_DEFAULTS: Pick<
  ExplicitCanvasBackground,
  'color' | 'size' | 'repeat' | 'attachment'
> = {
  color: 'transparent',
  size: 'cover',
  repeat: 'no-repeat',
  attachment: 'scroll',
};

const BACKGROUND_SIZES = ['auto', 'cover', 'contain', '100% 100%'] as const;
const BACKGROUND_REPEATS = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'] as const;
const BACKGROUND_ATTACHMENTS = ['fixed', 'scroll'] as const;
const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const normalized = normalizeString(value);
  return normalized && allowed.includes(normalized as T) ? (normalized as T) : undefined;
}

export function normalizeCanvasBackgroundImage(value: unknown): string | undefined {
  const trimmed = normalizeString(value);
  if (!trimmed) return undefined;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('//')) {
    return trimmed;
  }

  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/') ||
    trimmed.startsWith('/api/v1/uploads/') ||
    ABSOLUTE_URL_RE.test(trimmed)
  ) {
    return apiClient.resolveAssetUrl(trimmed);
  }

  return trimmed;
}

export function normalizeCanvasBackground(input: unknown): ExplicitCanvasBackground | undefined {
  if (typeof input === 'string') {
    const color = normalizeString(input);
    return color ? { ...BACKGROUND_DEFAULTS, color } : undefined;
  }

  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const raw = input as Record<string, unknown>;
  const color = normalizeString(raw.color);
  const image = normalizeCanvasBackgroundImage(raw.image);
  const size = normalizeEnum(raw.size, BACKGROUND_SIZES);
  const repeat = normalizeEnum(raw.repeat, BACKGROUND_REPEATS);
  const attachment = normalizeEnum(raw.attachment, BACKGROUND_ATTACHMENTS);

  if (!color && !image && !size && !repeat && !attachment) {
    return undefined;
  }

  return {
    ...BACKGROUND_DEFAULTS,
    ...(color ? { color } : {}),
    ...(image ? { image } : {}),
    ...(size ? { size } : {}),
    ...(repeat ? { repeat } : {}),
    ...(attachment ? { attachment } : {}),
  };
}

export function deriveCanvasBackgroundState(input: unknown): CanvasBackgroundState {
  const background = normalizeCanvasBackground(input);
  const bgColor =
    typeof input === 'string'
      ? (normalizeString(input) ?? '')
      : input && typeof input === 'object'
        ? (normalizeString((input as Record<string, unknown>).color) ?? '')
        : '';
  const bgImage =
    input && typeof input === 'object'
      ? (normalizeCanvasBackgroundImage((input as Record<string, unknown>).image) ?? '')
      : '';

  return {
    background,
    bgType: bgImage ? 'image' : 'color',
    bgValue: bgColor,
    bgColor,
    bgImage,
  };
}
