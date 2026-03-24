import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildError,
  getSourceBasename,
  inferModelFileExtension,
  isSupportedModelContentType,
  parseRemoteHttpUrl,
  readUpstreamError,
} from '../shared';

const MAX_IMPORT_SIZE = 100 * 1024 * 1024;
const MODEL_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'models');

type ImportRequestBody = {
  url?: string;
};

export async function POST(request: NextRequest) {
  let body: ImportRequestBody;

  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return buildError('Invalid JSON body', 400);
  }

  const targetUrl = parseRemoteHttpUrl(body.url?.trim());
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

    const contentLength = Number(upstream.headers.get('content-length') ?? '');
    if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_SIZE) {
      return buildError(
        `Remote model is too large. Maximum size is ${Math.round(MAX_IMPORT_SIZE / 1024 / 1024)}MB`,
        413,
      );
    }

    const contentType = upstream.headers.get('content-type');
    const extension = inferModelFileExtension(targetUrl, contentType);
    if (!extension || (contentType && !isSupportedModelContentType(contentType))) {
      return buildError('Only GLB and GLTF model files are supported', 400, contentType ?? '');
    }

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_IMPORT_SIZE) {
      return buildError(
        `Remote model is too large. Maximum size is ${Math.round(MAX_IMPORT_SIZE / 1024 / 1024)}MB`,
        413,
      );
    }

    if (!existsSync(MODEL_UPLOAD_DIR)) {
      await mkdir(MODEL_UPLOAD_DIR, { recursive: true });
    }

    const filename = `${nanoid()}-${getSourceBasename(targetUrl)}${extension}`;
    const filePath = join(MODEL_UPLOAD_DIR, filename);
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      url: `/uploads/models/${filename}`,
      filename,
      size: bytes.byteLength,
      type: contentType,
      sourceUrl: targetUrl.toString(),
      importedAt: new Date().toISOString(),
    });
  } catch (error) {
    return buildError(
      'Failed to import remote model',
      502,
      error instanceof Error ? error.message : undefined,
    );
  }
}
