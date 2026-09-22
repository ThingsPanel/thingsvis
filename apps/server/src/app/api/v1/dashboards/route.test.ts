import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  key: vi.fn(),
  permission: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  project: vi.fn(),
  defaultProject: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  prisma: {
    dashboard: { findMany: mocks.findMany, count: mocks.count, create: mocks.create },
    project: { findFirst: mocks.project },
  },
}));
vi.mock('@/lib/auth-helpers', () => ({ getSessionUser: mocks.session }));
vi.mock('@/lib/auth/api-key-auth', () => ({
  verifyApiKey: mocks.key,
  hasPermission: mocks.permission,
}));
vi.mock('@/lib/default-project', () => ({ ensureDefaultProject: mocks.defaultProject }));

import { GET, POST } from './route';
import { GET as openGET } from '../../open/v1/dashboards/route';

// Simulate tied timestamps across old projects, plus a different tenant.
const rows = Array.from({ length: 79 }, (_, i) => ({
  id: `board-${String(i).padStart(3, '0')}`,
  name: `Board ${i}`,
  projectId: `project-${i % 3}`,
  project: { tenantId: i === 78 ? 'other' : 'tenant-a' },
  updatedAt: '2026-09-14T07:54:57.935Z',
}));
function filtered(where: any) {
  return rows.filter(
    (row) =>
      row.project.tenantId === where.project.tenantId &&
      (!where.projectId || row.projectId === where.projectId) &&
      (!where.name || row.name.toLowerCase().includes(where.name.contains.toLowerCase())),
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ id: 'user-a', tenantId: 'tenant-a' });
  mocks.key.mockResolvedValue({ tenantId: 'tenant-a' });
  mocks.permission.mockReturnValue(true);
  mocks.count.mockImplementation(async ({ where }) => filtered(where).length);
  mocks.findMany.mockImplementation(async ({ where, orderBy, skip, take }) => {
    // Regression guard: a non-unique timestamp sort cannot safely paginate this data.
    expect(orderBy).toEqual([{ updatedAt: 'desc' }, { id: 'desc' }]);
    return filtered(where)
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(skip, skip + take);
  });
});

describe.each([
  ['session', GET],
  ['API key', openGET],
] as const)('%s dashboard listing', (_, list) => {
  it('returns all 78 tenant dashboards exactly once across four pages', async () => {
    const ids: string[] = [];
    for (let page = 1; page <= 4; page++) {
      const response = await list(
        new NextRequest(`http://localhost/api/v1/dashboards?page=${page}&limit=20`),
      );
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.meta.total).toBe(78);
      ids.push(...body.data.map((row: any) => row.id));
    }
    expect(ids).toHaveLength(78);
    expect(new Set(ids).size).toBe(78);
    expect(ids).not.toContain('board-078');
  });
  it('keeps old project filters tenant-scoped', async () => {
    const response = await list(
      new NextRequest('http://localhost/api/v1/dashboards?projectId=project-1&limit=100'),
    );
    const body = await response.json();
    expect(body.data).toHaveLength(26);
    expect(body.data.every((row: any) => row.projectId === 'project-1')).toBe(true);
  });
});

it('searches dashboard names without matching hidden project names', async () => {
  const response = await GET(
    new NextRequest('http://localhost/api/v1/dashboards?keyword=board%2077'),
  );
  expect((await response.json()).data.map((row: any) => row.id)).toEqual(['board-077']);
  expect(mocks.findMany.mock.calls[0][0].where).not.toHaveProperty('OR');
});
it('rejects unauthenticated requests before querying', async () => {
  mocks.session.mockResolvedValue(null);
  expect((await GET(new NextRequest('http://localhost/api/v1/dashboards'))).status).toBe(401);
  expect(mocks.findMany).not.toHaveBeenCalled();
});
it('creates a dashboard in the default project when no project is selected', async () => {
  mocks.defaultProject.mockResolvedValue({ id: 'default-a' });
  mocks.create.mockImplementation(async ({ data }) => ({ ...data, id: 'new-board' }));
  const response = await POST(
    new NextRequest('http://localhost/api/v1/dashboards', {
      method: 'POST',
      body: JSON.stringify({ name: 'New board' }),
    }),
  );
  expect(response.status).toBe(201);
  expect(mocks.defaultProject).toHaveBeenCalledWith('tenant-a', 'user-a');
  expect((await response.json()).projectId).toBe('default-a');
});
it('does not allow creating a board under another tenant project', async () => {
  mocks.project.mockResolvedValue(null);
  const response = await POST(
    new NextRequest('http://localhost/api/v1/dashboards', {
      method: 'POST',
      body: JSON.stringify({ name: 'New board', projectId: 'foreign-project' }),
    }),
  );
  expect(response.status).toBe(404);
  expect(mocks.create).not.toHaveBeenCalled();
});
