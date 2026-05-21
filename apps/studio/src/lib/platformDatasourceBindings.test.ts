import { describe, expect, it } from 'vitest';
import type { DataSource } from '@thingsvis/schema';
import {
  augmentPlatformDataSourcesForNodes,
  collectPlatformBindingRequirements,
  DEFAULT_HISTORY_BUFFER_SIZE,
} from './platformDatasourceBindings';

function createPlatformDataSource(id: string, config: Record<string, unknown> = {}): DataSource {
  return {
    id,
    name: id,
    type: 'PLATFORM_FIELD',
    config: {
      source: 'platform',
      fieldMappings: {},
      requestedFields: [],
      bufferSize: 0,
      ...config,
    },
  };
}

describe('platformDatasourceBindings', () => {
  it('collects requested platform fields and history requirements from node bindings', () => {
    const requirements = collectPlatformBindingRequirements([
      {
        type: 'chart/uplot-line',
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.__platform_dev-1__.data.cpu_usage__history }}',
          },
        ],
      },
      {
        type: 'basic/text',
        props: {
          text: '{{ ds.__platform__.data.temperature }}',
        },
      },
    ]);

    expect(requirements.get('__platform_dev-1__')).toEqual({
      needsHistory: true,
      requestedFields: new Set(['cpu_usage']),
    });
    expect(requirements.has('__platform__')).toBe(false);
  });

  it('augments existing platform data sources so history bindings enable buffers', () => {
    const nextConfigs = augmentPlatformDataSourcesForNodes(
      [createPlatformDataSource('__platform_dev-1__', { deviceId: 'dev-1' })],
      [
        {
          type: 'chart/uplot-line',
          data: [
            {
              targetProp: 'data',
              expression: '{{ ds.__platform_dev-1__.data.cpu_usage__history }}',
            },
          ],
        },
      ],
    );

    const deviceDataSource = nextConfigs.find((config) => config.id === '__platform_dev-1__');
    expect((deviceDataSource?.config as any)?.bufferSize).toBe(DEFAULT_HISTORY_BUFFER_SIZE);
  });

  it('preserves an existing non-zero platform buffer size when enabling history bindings', () => {
    const nextConfigs = augmentPlatformDataSourcesForNodes(
      [createPlatformDataSource('__platform_dev-2__', { deviceId: 'dev-2', bufferSize: 24 })],
      [
        {
          type: 'chart/uplot-line',
          data: [
            {
              targetProp: 'data',
              expression: '{{ ds.__platform_dev-2__.data.memory_usage__history }}',
            },
          ],
        },
      ],
    );

    expect((nextConfigs[0]?.config as any)?.bufferSize).toBe(24);
  });

  it('preserves host-injected deviceId for template platform data sources', () => {
    const nextConfigs = augmentPlatformDataSourcesForNodes(
      [
        createPlatformDataSource('__platform___template____', {
          deviceId: 'real-device-1',
        }),
      ],
      [
        {
          type: 'interaction/value-card-simple',
          data: [
            {
              targetProp: 'value',
              expression: '{{ ds.__platform___template____.data.temperature }}',
            },
          ],
        },
      ],
    );

    expect((nextConfigs[0]?.config as any)?.deviceId).toBe('real-device-1');
    expect((nextConfigs[0]?.config as any)?.requestedFields).toEqual(['temperature']);
  });

  it('creates missing platform data sources from node bindings', () => {
    const nextConfigs = augmentPlatformDataSourcesForNodes(
      [],
      [
        {
          type: 'chart/uplot-line',
          data: [
            {
              targetProp: 'data',
              expression: '{{ ds.__platform_dev-3__.data.cpu_usage__history }}',
            },
          ],
        },
      ],
    );

    expect(nextConfigs).toEqual([
      {
        id: '__platform_dev-3__',
        name: 'Device dev-3',
        type: 'PLATFORM_FIELD',
        config: {
          source: 'platform',
          fieldMappings: {},
          deviceId: 'dev-3',
          requestedFields: ['cpu_usage'],
          bufferSize: DEFAULT_HISTORY_BUFFER_SIZE,
        },
      },
    ]);
  });
});
