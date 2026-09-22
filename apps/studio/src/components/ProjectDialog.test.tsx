import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  switchProject: vi.fn(),
}));
vi.mock('@/hooks/useStorage', () => ({ useStorage: () => ({ isCloud: true, isLocal: false }) }));
vi.mock('@/contexts/ProjectContext', () => ({
  useProject: () => ({ currentProject: { id: 'old-project' }, switchProject: mocks.switchProject }),
}));
vi.mock('@/lib/api/dashboards', () => ({
  listDashboards: mocks.list,
  getDashboard: mocks.get,
  createDashboard: mocks.create,
}));

import { ProjectDialog } from './ProjectDialog';

let root: Root;
let container: HTMLDivElement;
const onLoad = vi.fn();
const onClose = vi.fn();
const board = (id: string, projectId: string) => ({
  id,
  projectId,
  name: `Board ${id}`,
  createdAt: '2026-09-14T00:00:00Z',
  updatedAt: '2026-09-14T00:00:00Z',
  canvasConfig: { mode: 'fixed', width: 1920, height: 1080 },
  nodes: [{ id: 'old-node' }],
  dataSources: [{ id: 'old-source' }],
  variables: [{ name: 'site', defaultValue: 'old-site' }],
});
async function render(open = true) {
  await act(async () =>
    root.render(
      <ProjectDialog
        open={open}
        onClose={onClose}
        onProjectLoad={onLoad}
        onNewProject={() => {}}
        language="zh"
      />,
    ),
  );
}
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  vi.resetAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.list.mockImplementation(async ({ page }) => ({
    data: {
      data: page === 1 ? [board('a', 'old-project')] : [board('b', 'other-old-project')],
      meta: { totalPages: 2 },
    },
  }));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('loads all pages without a project filter and opens an old dashboard with its ownership/content', async () => {
  await render();
  expect(mocks.list.mock.calls.map((call) => call[0])).toEqual([
    { page: 1, limit: 100 },
    { page: 2, limit: 100 },
  ]);
  expect(document.body.textContent).toContain('Board a');
  expect(document.body.textContent).toContain('Board b');
  expect(document.body.textContent).not.toContain('创建项目');
  mocks.get.mockResolvedValue({ data: board('b', 'other-old-project') });
  const button = [...document.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('Board b'),
  )!;
  await act(async () => button.click());
  expect(mocks.switchProject).toHaveBeenCalledWith('other-old-project');
  expect(mocks.get).toHaveBeenCalledWith('b');
  expect(onLoad).toHaveBeenCalledWith(
    expect.objectContaining({
      nodes: [{ id: 'old-node' }],
      dataSources: [{ id: 'old-source' }],
      variables: [{ name: 'site', defaultValue: 'old-site' }],
      meta: expect.objectContaining({ id: 'b' }),
    }),
  );
});
it('creates without a project selection and uses the server-returned default ownership', async () => {
  await render();
  mocks.create.mockResolvedValue({ data: board('new', 'default-project') });
  const button = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === '新建看板',
  )!;
  await act(async () => button.click());
  expect(mocks.create).toHaveBeenCalledWith({ name: '新建看板' });
  expect(mocks.switchProject).toHaveBeenCalledWith('default-project');
  expect(onLoad).toHaveBeenCalledWith(
    expect.objectContaining({ meta: expect.objectContaining({ id: 'new' }) }),
  );
});
it('can reopen after an error and retries instead of silently showing an empty list', async () => {
  mocks.list.mockResolvedValueOnce({ error: 'Network unavailable' });
  await render();
  expect(document.body.textContent).toContain('Network unavailable');
  const retry = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === '重试',
  )!;
  await act(async () => retry.click());
  expect(document.body.textContent).toContain('Board b');
  await render(false);
  await render();
  expect(mocks.list).toHaveBeenCalledTimes(5);
});
