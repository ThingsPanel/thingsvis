import { NextRequest, NextResponse } from 'next/server';

function buildError(message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function getTargetUrl(request: NextRequest): URL | null {
  const source = request.nextUrl.searchParams.get('url')?.trim();
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

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized === 'metadata.google.internal'
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
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function GET(request: NextRequest) {
  const targetUrl = getTargetUrl(request);
  if (!targetUrl) {
    return buildError('Invalid url parameter', 400);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const details = await upstream.text().catch(() => '');
      return buildError(
        `Upstream request failed with ${upstream.status} ${upstream.statusText}`.trim(),
        upstream.status,
        details.trim().slice(0, 400) || undefined,
      );
    }

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      headers.set('content-length', contentLength);
    }
    const cacheControl = upstream.headers.get('cache-control');
    headers.set('cache-control', cacheControl || 'public, max-age=300');

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : undefined;
    return buildError('Failed to fetch remote asset', 502, details);
  }
}
