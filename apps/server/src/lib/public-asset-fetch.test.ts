import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { gzipSync } from 'node:zlib';
import {
  isPublicAssetAddress,
  resolvePublicAssetAddress,
  fetchPublicAsset,
} from './public-asset-fetch';
vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));
vi.mock('node:os', () => ({ networkInterfaces: () => ({ eth0: [{ address: '9.9.9.9' }] }) }));
let calls: { url: URL; options: http.RequestOptions }[];
let responses: { status: number; headers?: Record<string, string>; body?: string | Buffer }[];
beforeEach(() => {
  calls = [];
  responses = [];
  vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never);
  const mock = ((
    url: URL,
    options: http.RequestOptions,
    callback: (response: http.IncomingMessage) => void,
  ) => {
    calls.push({ url, options });
    const spec = responses.shift() || { status: 200, body: 'asset' };
    const request = Object.assign(new EventEmitter(), {
      setTimeout: vi.fn(),
      destroy(error: Error) {
        request.emit('error', error);
      },
      end() {
        const stream = Object.assign(new PassThrough(), {
          statusCode: spec.status,
          headers: spec.headers || {},
        });
        callback(stream as unknown as http.IncomingMessage);
        stream.end(spec.body || '');
      },
    });
    return request;
  }) as unknown as typeof http.request;
  vi.spyOn(http, 'request').mockImplementation(mock);
  vi.spyOn(https, 'request').mockImplementation(mock);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it.each([
  '127.0.0.1',
  '10.0.0.1',
  '172.16.0.1',
  '192.168.1.1',
  '169.254.169.254',
  '100.100.100.200',
  '0.0.0.0',
  '255.255.255.255',
  '::1',
  '::',
  'fe80::1',
  'fc00::1',
  '::ffff:7f00:1',
  '::ffff:a00:5',
  '64:ff9b::7f00:1',
  '2002:7f00:1::',
  '9.9.9.9',
])('rejects private/special/self IP %s', (address) => {
  expect(isPublicAssetAddress(address)).toBe(false);
});
it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111', '::ffff:808:808'])(
  'allows public IP %s',
  (address) => {
    expect(isPublicAssetAddress(address)).toBe(true);
  },
);
it.each([
  'http://2130706433/',
  'http://127.1/',
  'http://0177.0.0.1/',
  'http://[0:0:0:0:0:ffff:7f00:0001]/',
  'http://localhost/',
  'http://metadata.google.internal/',
  'ftp://example.com/x',
  'http://user:pass@example.com/',
])('rejects unsafe URL %s', async (url) => {
  await expect(fetchPublicAsset(new URL(url))).rejects.toThrow('Only public');
  expect(calls).toHaveLength(0);
});
it('rejects private and mixed DNS answers before connecting', async () => {
  vi.mocked(lookup).mockResolvedValue([
    { address: '93.184.216.34', family: 4 },
    { address: '10.0.0.1', family: 4 },
  ] as never);
  await expect(fetchPublicAsset(new URL('https://example.com/'))).rejects.toThrow('Only public');
  expect(calls).toHaveLength(0);
});
it('blocks redirects to internal IPs', async () => {
  responses = [{ status: 302, headers: { location: 'http://[::ffff:7f00:1]:8000/' } }];
  await expect(fetchPublicAsset(new URL('https://example.com/'))).rejects.toThrow('Only public');
  expect(calls).toHaveLength(1);
});
it('revalidates DNS after public redirects', async () => {
  responses = [{ status: 302, headers: { location: 'https://next.example/x' } }];
  vi.mocked(lookup)
    .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as never)
    .mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }] as never);
  await expect(fetchPublicAsset(new URL('https://example.com/'))).rejects.toThrow('Only public');
  expect(calls).toHaveLength(1);
});
it('allows relative public redirects, preserves Range/Host and pins DNS without a second resolution', async () => {
  responses = [
    { status: 302, headers: { location: '/model.glb' } },
    { status: 206, headers: { 'content-range': 'bytes 0-4/5' }, body: 'model' },
  ];
  const response = await fetchPublicAsset(new URL('https://example.com/start'), {
    range: 'bytes=0-4',
  });
  expect(response.status).toBe(206);
  expect(await response.text()).toBe('model');
  expect(calls[1].url.href).toBe('https://example.com/model.glb');
  expect(calls[1].options.headers).toMatchObject({ range: 'bytes=0-4' });
  expect(calls[1].options.agent).toBe(false);
  const cb = vi.fn();
  (calls[1].options.lookup as Function)('example.com', { all: false }, cb);
  expect(cb).toHaveBeenCalledWith(null, '93.184.216.34', 4);
  const cbAll = vi.fn();
  (calls[1].options.lookup as Function)('example.com', { all: true }, cbAll);
  expect(cbAll).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }]);
  expect(lookup).toHaveBeenCalledTimes(2);
});
it('rejects self hostname and bounded redirect loops', async () => {
  await expect(
    resolvePublicAssetAddress(new URL('https://self.example/'), 'self.example'),
  ).rejects.toThrow('Only public');
  responses = Array.from({ length: 6 }, () => ({ status: 302, headers: { location: '/again' } }));
  await expect(fetchPublicAsset(new URL('https://example.com/'))).rejects.toThrow('redirect');
  expect(calls).toHaveLength(6);
});
it('decompresses upstream gzip without forwarding stale length headers', async () => {
  responses = [
    {
      status: 200,
      headers: { 'content-encoding': 'gzip', 'content-length': '99' },
      body: gzipSync('model'),
    },
  ];
  const response = await fetchPublicAsset(new URL('https://example.com/'));
  expect(await response.text()).toBe('model');
  expect(response.headers.has('content-length')).toBe(false);
});

it('blocks configured public NAT addresses and self aliases', async () => {
  vi.stubEnv('ASSET_SELF_HOSTS', '93.184.216.34,self.example');
  await expect(fetchPublicAsset(new URL('https://self.example/'))).rejects.toThrow('Only public');
  await expect(fetchPublicAsset(new URL('https://alias.example/'))).rejects.toThrow('Only public');
  expect(calls).toHaveLength(0);
});
