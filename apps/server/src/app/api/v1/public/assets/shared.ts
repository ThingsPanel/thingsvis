import { basename, extname } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1', 'metadata.google.internal']);

const PRIVATE_IPV4_RANGES = [
  { a: 10 },
  { a: 127 },
  { a: 0 },
  { a: 169, b: 254 },
  { a: 172, bMin: 16, bMax: 31 },
  { a: 192, b: 168 },
];

const FALLBACK_EXTENSION_BY_TYPE: Record<string, '.glb' | '.gltf'> = {
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf',
  'application/octet-stream': '.glb',
  'application/gltf-buffer': '.glb',
  'application/json': '.gltf',
};

export function buildError(message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    BLOCKED_HOSTNAMES.has(normalized) ||
    normalized.endsWith('.localhost') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  ) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = octets;
  return PRIVATE_IPV4_RANGES.some((range) => {
    if (range.a !== a) return false;
    if (typeof range.b === 'number') return range.b === b;
    if (typeof range.bMin === 'number' && typeof range.bMax === 'number') {
      return b >= range.bMin && b <= range.bMax;
    }
    return true;
  });
}

export function getTargetUrl(request: NextRequest, paramName = 'url'): URL | null {
  const source = request.nextUrl.searchParams.get(paramName)?.trim();
  return parseRemoteHttpUrl(source);
}

export function parseRemoteHttpUrl(source: string | null | undefined): URL | null {
  if (!source) {
    return null;
  }

  try {
    const url = new URL(source);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (isBlockedHostname(url.hostname)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function readUpstreamError(response: Response): Promise<string | undefined> {
  const text = await response.text().catch(() => '');
  const trimmed = text.trim().slice(0, 400);
  return trimmed || undefined;
}

export function isSupportedModelContentType(contentType: string | null): boolean {
  const normalized = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';
  return normalized in FALLBACK_EXTENSION_BY_TYPE;
}

export function inferModelFileExtension(
  sourceUrl: URL,
  contentType: string | null,
): '.glb' | '.gltf' | null {
  const pathExt = extname(sourceUrl.pathname).toLowerCase();
  if (pathExt === '.glb' || pathExt === '.gltf') {
    return pathExt;
  }

  const normalizedType = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';
  return FALLBACK_EXTENSION_BY_TYPE[normalizedType] ?? null;
}

export function sanitizeFilename(stem: string): string {
  const normalized = stem.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  return normalized.replace(/^-+|-+$/g, '') || 'model';
}

export function getSourceBasename(sourceUrl: URL): string {
  const raw = basename(sourceUrl.pathname, extname(sourceUrl.pathname));
  return sanitizeFilename(raw);
}
