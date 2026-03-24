import { NextRequest, NextResponse } from 'next/server';
import { buildError, getTargetUrl, readUpstreamError } from '../shared';

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
      return buildError(
        `Upstream request failed with ${upstream.status} ${upstream.statusText}`.trim(),
        upstream.status,
        await readUpstreamError(upstream),
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
