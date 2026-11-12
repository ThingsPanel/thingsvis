import { fetchPublicAsset, UnsafeAssetUrl } from '@/lib/public-asset-fetch';
import { NextRequest, NextResponse } from 'next/server';
import { buildError, getTargetUrl } from '../shared';

export async function GET(request: NextRequest) {
  const targetUrl = getTargetUrl(request);
  if (!targetUrl) {
    return buildError('Invalid url parameter', 400);
  }

  try {
    const range = request.headers.get('range');

    const upstream = await fetchPublicAsset(targetUrl, {
      range: range || undefined,
      signal: request.signal,
      selfHostname: request.nextUrl.hostname,
    });

    if (!upstream.ok) {
      await upstream.body?.cancel();
      return buildError(
        `Upstream request failed with ${upstream.status} ${upstream.statusText}`.trim(),
        upstream.status,
      );
    }

    const headers = new Headers();
    for (const headerName of [
      'content-type',
      'content-encoding',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ]) {
      const headerValue = upstream.headers.get(headerName);
      if (headerValue) {
        headers.set(headerName, headerValue);
      }
    }

    const cacheControl = upstream.headers.get('cache-control');
    headers.set('cache-control', cacheControl || 'public, max-age=300');
    headers.set('x-accel-buffering', 'no');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return buildError(
      error instanceof UnsafeAssetUrl ? error.message : 'Failed to fetch remote asset',
      error instanceof UnsafeAssetUrl ? 400 : 502,
    );
  }
}
