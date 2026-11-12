import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { getSessionUser } from '@/lib/auth-helpers';
import {
  checkUploadRate,
  readUploadForm,
  validateUpload,
  storeUpload,
  UploadError,
} from '@/lib/upload-security';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await checkUploadRate(user.id);
    const form = await readUploadForm(request);
    const file = form.get('file');
    if (!file || typeof file === 'string') throw new UploadError(400, 'No file provided');
    const bytes = Buffer.from(await file.arrayBuffer());
    const target = validateUpload(file, bytes);
    const filename = `${nanoid()}${target.extension}`;
    const root = join(process.cwd(), 'public', 'uploads');
    const relative = target.model ? `models/${filename}` : filename;
    await storeUpload(root, join(root, relative), bytes);
    return NextResponse.json({
      url: `/uploads/${relative}`,
      filename,
      size: bytes.length,
      type: target.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
    });
  } catch (error) {
    if (error instanceof UploadError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  return NextResponse.json({
    message: 'File listing not implemented',
    hint: 'Files are stored in /public/uploads/',
  });
}
