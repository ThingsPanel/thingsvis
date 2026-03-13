import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const API_KEY_PREFIX = 'tvk_';
const HEADER_API_KEY = 'x-api-key';
const BEARER_PREFIX = 'Bearer ';

export interface ApiKeyPrincipal {
  appId: string;
  tenantId: string;
  permissions: string[];
}

/** Compute SHA-256 hex digest of a raw key string. */
function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Extract the raw API key from the request.
 * Accepts: X-Api-Key header OR Authorization: Bearer <key> header.
 * Returns null if no API key header is present.
 */
function extractRawKey(request: NextRequest): string | null {
  const xApiKey = request.headers.get(HEADER_API_KEY);
  if (xApiKey) return xApiKey;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    return authHeader.slice(BEARER_PREFIX.length);
  }

  return null;
}

/**
 * Verify an Open API request using an API key.
 *
 * Security notes:
 *   - Only the SHA-256 hash of the key is stored in the DB (no plaintext).
 *   - The prefix 'tvk_' is mandatory; requests without it are rejected early.
 *   - Expired or revoked keys are rejected.
 *   - lastUsedAt is updated asynchronously (fire-and-forget) to avoid adding
 *     latency to each request.
 *
 * @returns ApiKeyPrincipal on success, null on failure.
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKeyPrincipal | null> {
  const rawKey = extractRawKey(request);
  if (!rawKey?.startsWith(API_KEY_PREFIX)) return null;

  const keyHash = sha256(rawKey);

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, isRevoked: false },
    include: {
      app: {
        select: { id: true, tenantId: true, permissions: true, isActive: true },
      },
    },
  });

  if (!apiKey || !apiKey.app.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Fire-and-forget last-used timestamp update
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {
    /* best effort */
  });

  let permissions: string[] = [];
  try {
    permissions = JSON.parse(apiKey.app.permissions) as string[];
  } catch {
    permissions = [];
  }

  return {
    appId: apiKey.app.id,
    tenantId: apiKey.app.tenantId,
    permissions,
  };
}

/**
 * Check whether a principal has the required permission.
 */
export function hasPermission(principal: ApiKeyPrincipal, permission: string): boolean {
  return principal.permissions.includes(permission);
}

/**
 * Generate a cryptographically random API key.
 * Returns { rawKey, prefix, keyHash }.
 * rawKey is shown to the user ONCE and never stored.
 */
export function generateApiKey(): { rawKey: string; prefix: string; keyHash: string } {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const random = randomBytes(32).toString('hex');
  const rawKey = `${API_KEY_PREFIX}${random}`;
  const prefix = rawKey.slice(0, 12); // "tvk_" + first 8 hex chars
  const keyHash = sha256(rawKey);
  return { rawKey, prefix, keyHash };
}
