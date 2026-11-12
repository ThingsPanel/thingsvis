import { mkdir, readdir, stat, readFile, writeFile, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { prisma } from './db';

export class UploadError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function limit(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid ${name}`);
  return value;
}
export function uploadLimits() {
  return {
    image: limit('UPLOAD_IMAGE_MAX_BYTES', 10 * 1024 * 1024),
    model: limit('UPLOAD_MODEL_MAX_BYTES', 50 * 1024 * 1024),
    total: limit('UPLOAD_TOTAL_MAX_BYTES', 1024 * 1024 * 1024),
    perMinute: limit('UPLOAD_REQUESTS_PER_MINUTE', 10),
  };
}

// PostgreSQL transaction lock serializes workers/replicas using the same database.
// Upload data and rate state must share a persistent volume between replicas.
async function locked<T>(action: () => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(821027, 20)`;
      return action();
    },
    { timeout: 30000, maxWait: 5000 },
  );
}

export async function checkUploadRate(userId: string) {
  const max = uploadLimits().perMinute;
  await locked(async () => {
    const dir = join(process.cwd(), '.upload-limits');
    await mkdir(dir, { recursive: true });
    const file = join(dir, createHash('sha256').update(userId).digest('hex') + '.json');
    const now = Date.now();
    let state = { start: now, count: 0 };
    try {
      state = JSON.parse(await readFile(file, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (!Number.isFinite(state.start) || !Number.isInteger(state.count) || state.count < 0)
      throw new Error('Invalid upload rate state');
    if (now - state.start >= 60000) state = { start: now, count: 0 };
    if (state.count >= max)
      throw new UploadError(429, 'Upload rate limit exceeded; retry after one minute');
    state.count++;
    await writeFile(file, JSON.stringify(state), { mode: 0o600 });
  });
}

export async function readUploadForm(request: Request): Promise<FormData> {
  const limits = uploadLimits();
  const max = Math.max(limits.image, limits.model) + 1024 * 1024;
  if (Number(request.headers.get('content-length')) > max)
    throw new UploadError(413, 'Request too large');
  if (!request.body) throw new UploadError(400, 'Missing upload body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new UploadError(413, 'Request too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
    }).formData();
  } catch {
    throw new UploadError(400, 'Invalid multipart form');
  }
}

export function validateUpload(
  file: File,
  bytes: Buffer,
): { extension: string; model: boolean; type: string } {
  const extension = extname(file.name).toLowerCase();
  const limits = uploadLimits();
  let type = '';
  const model = extension === '.glb' || extension === '.gltf';
  if (!bytes.length || bytes.length > (model ? limits.model : limits.image))
    throw new UploadError(413, 'File exceeds size limit or is empty');
  if (
    extension === '.png' &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    type = 'image/png';
  if (
    ['.jpg', '.jpeg'].includes(extension) &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    type = 'image/jpeg';
  if (extension === '.gif' && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)))
    type = 'image/gif';
  if (
    extension === '.webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    type = 'image/webp';
  if (
    extension === '.glb' &&
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'glTF' &&
    bytes.readUInt32LE(4) === 2 &&
    bytes.readUInt32LE(8) === bytes.length
  )
    type = 'model/gltf-binary';
  if (extension === '.gltf') {
    try {
      if (JSON.parse(bytes.toString('utf8')).asset?.version === '2.0') type = 'model/gltf+json';
    } catch {
      /* rejected below */
    }
  }
  if (!type)
    throw new UploadError(
      400,
      'Invalid file content/type. Allowed: JPEG, PNG, GIF, WebP, GLB, GLTF',
    );
  return { extension, model, type };
}

async function directoryBytes(dir: string): Promise<number> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }
  let total = 0;
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(path);
    else if (entry.isFile()) total += (await stat(path)).size;
    else throw new Error('Unsupported entry in upload directory');
  }
  return total;
}

export async function storeUpload(root: string, path: string, bytes: Buffer) {
  await locked(async () => {
    if ((await directoryBytes(root)) + bytes.length > uploadLimits().total)
      throw new UploadError(507, 'Upload storage quota exceeded');
    await mkdir(root, { recursive: true });
    await mkdir(join(root, 'models'), { recursive: true });
    try {
      await writeFile(path, bytes, { flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') await unlink(path).catch(() => {});
      throw error;
    }
  });
}
