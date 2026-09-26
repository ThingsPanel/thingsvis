type ThingsPanelUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN';
};

type VerificationResult =
  | { ok: true; user: ThingsPanelUser }
  | { ok: false; status: 401 | 503 };

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

const THINGSPANEL_SYSTEM_TENANT_ID = 'sys-admin';
const roleByAuthority: Record<string, ThingsPanelUser['role']> = {
  SYS_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
};

/** Resolve a ThingsPanel JWT to authoritative identity and role information. */
export async function verifyThingsPanelSession(
  token: string,
  options: { baseUrl?: string; fetcher?: FetchLike } = {},
): Promise<VerificationResult> {
  const baseUrl = (options.baseUrl ?? process.env.THINGSPANEL_API_BASE_URL)?.replace(/\/+$/, '');
  if (!baseUrl) return { ok: false, status: 503 };
  try {
    const target = new URL(baseUrl);
    const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
    if (target.protocol !== 'https:' && !localHost) return { ok: false, status: 503 };
  } catch {
    return { ok: false, status: 503 };
  }

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(`${baseUrl}/api/v1/board/user/info`, {
      method: 'GET',
      headers: { 'x-token': token, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return { ok: false, status: 503 };
  }
  if (!response.ok) return { ok: false, status: 401 };

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, status: 401 };
  }
  if (!isRecord(payload) || payload.code !== 200 || !isRecord(payload.data)) {
    return { ok: false, status: 401 };
  }

  const data = payload.data;
  if (
    typeof data.id !== 'string' || !data.id ||
    typeof data.email !== 'string' || !data.email.includes('@')
  ) {
    return { ok: false, status: 401 };
  }

  if (typeof data.authority !== 'string' || !roleByAuthority[data.authority]) {
    return { ok: false, status: 401 };
  }

  const tenantId = typeof data.tenant_id === 'string' ? data.tenant_id.trim() : '';
  const resolvedTenantId = data.authority === 'SYS_ADMIN'
    ? tenantId || THINGSPANEL_SYSTEM_TENANT_ID
    : tenantId;
  if (!resolvedTenantId) return { ok: false, status: 401 };

  const email = data.email.trim();
  return {
    ok: true,
    user: {
      id: data.id,
      email,
      name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : email.split('@')[0],
      tenantId: resolvedTenantId,
      role: roleByAuthority[data.authority],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
