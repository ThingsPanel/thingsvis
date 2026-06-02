import { NextRequest, NextResponse } from 'next/server';
import { buildError, getTargetUrl, readUpstreamError } from '../shared';

export async function GET(request: NextRequest) {
  const targetUrl = getTargetUrl(request);
  if (!targetUrl) {
    return buildError('Invalid url parameter', 400);
  }

  try {
    const upstreamHeaders = new Headers();
    const range = request.headers.get('range');
    if (range) {
      upstreamHeaders.set('range', range);
    }

    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
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
    for (const headerName of [
      'content-type',
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
    const details = error instanceof Error ? error.message : undefined;
    return buildError('Failed to fetch remote asset', 502, details);
  }
}
