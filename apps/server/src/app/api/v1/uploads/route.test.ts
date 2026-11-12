import { beforeEach, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { checkUploadRate, storeUpload } from '@/lib/upload-security';
import { POST } from './route';
vi.mock('@/lib/auth-helpers', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/upload-security', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/upload-security')>()),
  checkUploadRate: vi.fn(),
  storeUpload: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ prisma: {} }));
beforeEach(() => vi.clearAllMocks());
it('rejects anonymous uploads before reading the body', async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  const request = new NextRequest('http://localhost/api/v1/uploads', {
    method: 'POST',
    body: 'invalid',
  });
  expect((await POST(request)).status).toBe(401);
  expect(checkUploadRate).not.toHaveBeenCalled();
  expect(storeUpload).not.toHaveBeenCalled();
});
it('allows authenticated PNG uploads and derives a safe filename', async () => {
  vi.mocked(getSessionUser).mockResolvedValue({ id: 'user-1' } as never);
  const form = new FormData();
  form.set(
    'file',
    new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }),
    'image.PNG',
  );
  const response = await POST(
    new NextRequest('http://localhost/api/v1/uploads', { method: 'POST', body: form }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ uploadedBy: 'user-1', type: 'image/png' });
  expect(storeUpload).toHaveBeenCalledOnce();
});
it('rejects authenticated SVG uploads', async () => {
  vi.mocked(getSessionUser).mockResolvedValue({ id: 'user-1' } as never);
  const form = new FormData();
  form.set('file', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'x.svg');
  expect(
    (await POST(new NextRequest('http://localhost/api/v1/uploads', { method: 'POST', body: form })))
      .status,
  ).toBe(400);
  expect(storeUpload).not.toHaveBeenCalled();
});

it('blocks legacy SVG downloads before reading files', async () => {
  const { GET } = await import('./[...filename]/route');
  const response = await GET(new NextRequest('http://localhost/api/v1/uploads/old.svg'), {
    params: Promise.resolve({ filename: ['old.svg'] }),
  });
  expect(response.status).toBe(403);
});
