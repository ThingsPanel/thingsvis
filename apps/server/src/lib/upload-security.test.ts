import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { File } from 'node:buffer';
import { checkUploadRate, readUploadForm, validateUpload, storeUpload } from './upload-security';

vi.mock('./db', () => {
  let queue = Promise.resolve();
  return {
    prisma: {
      $transaction: (action: (tx: unknown) => Promise<unknown>) => {
        const next = queue.then(() => action({ $executeRaw: async () => 0 }));
        queue = next.then(
          () => undefined,
          () => undefined,
        );
        return next;
      },
    },
  };
});
let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'thingsvis-upload-'));
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

it('rejects SVG, disguised HTML, and extension/MIME tricks', () => {
  for (const [name, content] of [
    ['x.svg', '<svg onload="alert(1)"/>'],
    ['x.png', '<html>test</html>'],
    ['x.html', '\x89PNG'],
  ]) {
    const bytes = Buffer.from(content);
    expect(() =>
      validateUpload(
        new File([bytes], name, { type: 'image/png' }) as unknown as globalThis.File,
        bytes,
      ),
    ).toThrow('Invalid file');
  }
});
it('accepts raster magic and glTF/GLB with safe derived type', () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(
    validateUpload(new File([png], 'x.PNG') as unknown as globalThis.File, png).extension,
  ).toBe('.png');
  const gltf = Buffer.from('{"asset":{"version":"2.0"}}');
  expect(validateUpload(new File([gltf], 'x.gltf') as unknown as globalThis.File, gltf).model).toBe(
    true,
  );
  const glb = Buffer.alloc(12);
  glb.write('glTF');
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(12, 8);
  expect(validateUpload(new File([glb], 'x.glb') as unknown as globalThis.File, glb).type).toBe(
    'model/gltf-binary',
  );
});
it('enforces per-file size', () => {
  vi.stubEnv('UPLOAD_IMAGE_MAX_BYTES', '4');
  expect(() =>
    validateUpload(
      new File(['12345'], 'x.png') as unknown as globalThis.File,
      Buffer.from('12345'),
    ),
  ).toThrow('size limit');
});
it('rejects oversized declared and chunked bodies before parsing multipart', async () => {
  vi.stubEnv('UPLOAD_IMAGE_MAX_BYTES', '1');
  vi.stubEnv('UPLOAD_MODEL_MAX_BYTES', '1');
  await expect(
    readUploadForm(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-length': '9999999' },
        body: 'a',
      }),
    ),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    readUploadForm(
      new Request('http://localhost', { method: 'POST', body: Buffer.alloc(1048578) }),
    ),
  ).rejects.toMatchObject({ status: 413 });
});
it('accepts bounded multipart bodies', async () => {
  const form = new FormData();
  form.set('file', new Blob(['sample']), 'test.png');
  const parsed = await readUploadForm(
    new Request('http://localhost', { method: 'POST', body: form }),
  );
  expect((parsed.get('file') as globalThis.File).size).toBe(6);
});
it('limits users independently and resets after one minute', async () => {
  vi.stubEnv('UPLOAD_REQUESTS_PER_MINUTE', '2');
  const now = vi.spyOn(Date, 'now').mockReturnValue(100000);
  await checkUploadRate('a');
  await checkUploadRate('a');
  await expect(checkUploadRate('a')).rejects.toMatchObject({ status: 429 });
  await checkUploadRate('b');
  now.mockReturnValue(160001);
  await checkUploadRate('a');
});
it('serializes concurrent quota checks and counts existing model files', async () => {
  vi.stubEnv('UPLOAD_TOTAL_MAX_BYTES', '10');
  const root = join(dir, 'public/uploads');
  await mkdir(join(root, 'models'), { recursive: true });
  await writeFile(join(root, 'models/existing.glb'), Buffer.alloc(4));
  const results = await Promise.allSettled([
    storeUpload(root, join(root, 'a.png'), Buffer.alloc(4)),
    storeUpload(root, join(root, 'b.png'), Buffer.alloc(4)),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  expect(await readFile(join(root, 'a.png'))).toHaveLength(4);
});
