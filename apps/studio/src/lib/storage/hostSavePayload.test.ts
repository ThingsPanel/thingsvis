import { describe, expect, it, beforeEach } from 'vitest';
import type { ProjectFile } from './schemas';
import { buildHostSavePayload } from './hostSavePayload';
import { TEMPLATE_DEVICE_ID } from '../embedded/hostDataSourcePolicy';

function createProject(): ProjectFile {
  return {
    meta: {
      version: '1.0.0',
      id: 'dashboard-1',
      name: 'Dashboard',
      createdAt: 1,
      updatedAt: 2,
    },
    canvas: {
      mode: 'fixed',
      width: 1920,
      height: 1080,
    },
    nodes: [
      {
        id: 'node-1',
        type: 'widget',
        widgetId: 'basic/text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 40 },
        props: {
          temperature: 0,
          title: 'Sensor',
        },
        data: [
          {
            targetProp: 'temperature',
            expression: '{{ ds.__platform___template____.data.temperature }}',
            historyConfig: { window: '1h' },
          },
        ],
      },
    ],
    dataSources: [
      {
        id: '__platform___template____',
        type: 'PLATFORM_FIELD',
        config: { source: 'platform', deviceId: TEMPLATE_DEVICE_ID, requestedFields: [] },
        __editorAutoManual: true,
        mode: 'manual',
      } as any,
      {
        id: '__platform_unreferenced__',
        type: 'PLATFORM_FIELD',
        config: { source: 'platform', deviceId: 'device-2' },
      } as any,
      {
        id: 'custom_rest',
        type: 'REST',
        config: { url: '/custom' },
      },
    ],
    variables: [],
  };
}

describe('hostSavePayload', () => {
  beforeEach(() => {
    window.history.replaceState(
      null,
      '',
      '/main#/editor?mode=embedded&context=device-template&saveTarget=host',
    );
  });

  it('builds a host payload with sanitized data sources and data bindings', () => {
    const { projectForSave, payload } = buildHostSavePayload(createProject());

    expect(projectForSave.nodes[0].props).toEqual({ title: 'Sensor' });
    expect(payload.dataSources).toEqual([
      {
        id: '__platform___template____',
        type: 'PLATFORM_FIELD',
        config: { source: 'platform', requestedFields: [] },
      },
      {
        id: 'custom_rest',
        type: 'REST',
        config: { url: '/custom' },
      },
    ]);
    expect(payload.dataBindings).toEqual([
      {
        nodeId: 'node-1',
        targetProp: 'temperature',
        expression: '{{ ds.__platform___template____.data.temperature }}',
        transform: undefined,
        historyConfig: { window: '1h' },
      },
    ]);
  });
});
