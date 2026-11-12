import { validatePublicAssetUrl } from '@/lib/public-asset-fetch';
import { basename, extname } from 'path';
import { NextRequest, NextResponse } from 'next/server';

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
  try {
    const host = hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
    validatePublicAssetUrl(new URL(`http://${host}/`));
    return false;
  } catch {
    return true;
  }
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
    if (url.username || url.password || isBlockedHostname(url.hostname)) {
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
