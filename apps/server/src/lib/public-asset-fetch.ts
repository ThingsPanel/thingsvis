import { lookup } from 'node:dns/promises';
import { isIP, type LookupFunction } from 'node:net';
import { networkInterfaces } from 'node:os';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import ipaddr from 'ipaddr.js';

export class UnsafeAssetUrl extends Error {
  constructor() {
    super('Only public HTTP/HTTPS asset addresses are allowed');
  }
}
const hostname = (value: string) =>
  value
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');

function configuredSelfHosts(): string[] {
  const values = (process.env.ASSET_SELF_HOSTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  for (const value of [process.env.AUTH_URL, process.env.NEXTAUTH_URL]) {
    if (value) {
      try {
        values.push(new URL(value).hostname);
      } catch {
        /* not an asset target */
      }
    }
  }
  return values.map(hostname);
}

function normalizedAddress(value: string): string {
  return ipaddr.process(value).toNormalizedString();
}
export function isPublicAssetAddress(value: string): boolean {
  try {
    const address = ipaddr.process(value);
    if (address.toString() === '168.63.129.16') return false; // Azure platform virtual address.
    if (address.range() !== 'unicast') return false;
    // Only globally routable IPv6; exclude translation/tunnel/special-use ranges.
    if (address.kind() === 'ipv6' && !address.match(ipaddr.parse('2000::'), 3)) return false;
    if (
      configuredSelfHosts().some(
        (host) => isIP(host) && normalizedAddress(host) === address.toNormalizedString(),
      )
    )
      return false;
    const own = Object.values(networkInterfaces()).flatMap((entries) => entries || []);
    return !own.some((entry) => normalizedAddress(entry.address) === address.toNormalizedString());
  } catch {
    return false;
  }
}

export function validatePublicAssetUrl(url: URL, selfHostname?: string) {
  const host = hostname(url.hostname);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === 'metadata.google.internal' ||
    host === 'metadata.goog' ||
    configuredSelfHosts().includes(host) ||
    (selfHostname && host === hostname(selfHostname)) ||
    (isIP(host) && !isPublicAssetAddress(host))
  )
    throw new UnsafeAssetUrl();
}

export async function resolvePublicAssetAddress(url: URL, selfHostname?: string) {
  validatePublicAssetUrl(url, selfHostname);
  const host = hostname(url.hostname);
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true, verbatim: true });
  // Fail closed for mixed public/private DNS answers as well as empty answers.
  if (!addresses.length || addresses.some((entry) => !isPublicAssetAddress(entry.address)))
    throw new UnsafeAssetUrl();
  return addresses[0];
}

async function requestPinned(
  url: URL,
  address: { address: string; family: number },
  range?: string,
  signal?: AbortSignal,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const pinnedLookup: LookupFunction = (_host, options, callback) => {
      if (options.all) callback(null, [address]);
      else callback(null, address.address, address.family);
    };
    const request = (url.protocol === 'https:' ? https : http).request(
      url,
      {
        method: 'GET',
        agent: false,
        lookup: pinnedLookup,
        family: address.family,
        headers: { 'accept-encoding': 'identity', ...(range ? { range } : {}) },
        signal,
      },
      (upstream) => {
        const status = upstream.statusCode || 502;
        const headers = new Headers();
        for (const [name, value] of Object.entries(upstream.headers)) {
          if (
            value !== undefined &&
            !['connection', 'transfer-encoding', 'keep-alive'].includes(name)
          )
            headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
        let stream: Readable = upstream;
        const encoding = headers.get('content-encoding');
        const decoder =
          encoding === 'gzip'
            ? createGunzip()
            : encoding === 'deflate'
              ? createInflate()
              : encoding === 'br'
                ? createBrotliDecompress()
                : null;
        if (decoder) {
          upstream.on('error', (error) => decoder.destroy(error));
          stream = upstream.pipe(decoder);
          headers.delete('content-encoding');
          headers.delete('content-length');
        }
        // Destroy sockets on body cancellation, redirects, and response errors.
        stream.once('close', () => upstream.destroy());
        const empty = [204, 205, 304].includes(status);
        if (empty) upstream.destroy();
        resolve(
          new Response(empty ? null : (Readable.toWeb(stream) as ReadableStream<Uint8Array>), {
            status,
            headers,
          }),
        );
      },
    );
    request.setTimeout(30000, () => request.destroy(new Error('Asset request timed out')));
    request.once('error', reject);
    request.end();
  });
}

// Resolve every redirect and pin each socket lookup to the validated address.
// Keep the URL hostname for HTTP Host and HTTPS certificate/SNI verification.
export async function fetchPublicAsset(
  initial: URL,
  options: { range?: string; signal?: AbortSignal; selfHostname?: string } = {},
): Promise<Response> {
  let url = new URL(initial);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(120000)])
    : AbortSignal.timeout(120000);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const address = await resolvePublicAssetAddress(url, options.selfHostname);
    const response = await requestPinned(url, address, options.range, signal);
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location || redirects === 5) throw new Error('Invalid asset redirect');
    url = new URL(location, url);
  }
  throw new Error('Too many asset redirects');
}
