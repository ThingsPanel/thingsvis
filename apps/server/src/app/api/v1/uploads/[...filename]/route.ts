import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
};

function sanitizeSegments(segments: string[]): string[] | null {
  const sanitized = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''));

  if (sanitized.length === 0) {
    return null;
  }

  if (sanitized.some((segment) => segment === '.' || segment === '..' || segment.includes('..'))) {
    return null;
  }

  return sanitized;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string[] }> },
) {
  try {
    const { filename } = await context.params;
    const safeSegments = sanitizeSegments(filename);
    if (!safeSegments) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', ...safeSegments);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const extension = extname(safeSegments[safeSegments.length - 1] || '').toLowerCase();
    const contentType = MIME_TYPES[extension] ?? 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
