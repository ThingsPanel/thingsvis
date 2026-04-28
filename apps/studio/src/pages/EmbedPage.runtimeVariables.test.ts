import { describe, expect, it } from 'vitest';
import {
  buildEmbedRuntimeVariableValues,
  mergeEmbedRuntimeVariableDefinitions,
  resolveEmbedRuntimeVariableValues,
} from '@/embed/runtimeVariables';

describe('EmbedPage runtime variables', () => {
  it('maps embed config into explicit runtime variables', () => {
    expect(
      buildEmbedRuntimeVariableValues(
        {
          platformApiBaseUrl: 'https://platform.example.com',
          thingsvisApiBaseUrl: 'https://thingsvis.example.com',
          platformToken: 'platform-token',
          deviceId: 'device-001',
          dateRange: { startTime: 1000, endTime: 2000 },
        },
        null,
      ),
    ).toEqual({
      platformApiBaseUrl: 'https://platform.example.com',
      thingsvisApiBaseUrl: 'https://thingsvis.example.com',
      platformToken: 'platform-token',
      deviceId: 'device-001',
      dateRange: { startTime: 1000, endTime: 2000 },
    });
  });

  it('preserves explicit URL defaults and only fills empty runtime-managed defaults', () => {
    const runtimeValues = {
      platformApiBaseUrl: 'https://platform.example.com',
      thingsvisApiBaseUrl: 'https://thingsvis.example.com',
      platformToken: 'runtime-only-token',
      deviceId: 'device-001',
    };
    const definitions = [
      { name: 'deviceId', type: 'string', defaultValue: 'from-dashboard' },
      {
        name: 'platformApiBaseUrl',
        type: 'string',
        defaultValue: 'https://legacy-platform.example.com',
      },
      {
        name: 'thingsvisApiBaseUrl',
        type: 'string',
        defaultValue: '',
      },
    ];

    expect(resolveEmbedRuntimeVariableValues(definitions, runtimeValues)).toMatchObject({
      platformApiBaseUrl: 'https://legacy-platform.example.com',
      thingsvisApiBaseUrl: 'https://thingsvis.example.com',
      deviceId: 'device-001',
    });

    const merged = mergeEmbedRuntimeVariableDefinitions(
      definitions,
      resolveEmbedRuntimeVariableValues(definitions, runtimeValues),
    );

    expect(merged.find((definition) => definition.name === 'deviceId')?.defaultValue).toBe(
      'from-dashboard',
    );
    expect(
      merged.find((definition) => definition.name === 'platformApiBaseUrl')?.defaultValue,
    ).toBe('https://legacy-platform.example.com');
    expect(
      merged.find((definition) => definition.name === 'thingsvisApiBaseUrl')?.defaultValue,
    ).toBe('https://thingsvis.example.com');
    expect(merged.map((definition) => definition.name)).toEqual([
      'deviceId',
      'platformApiBaseUrl',
      'thingsvisApiBaseUrl',
      'dateRange',
    ]);
    expect(merged.some((definition) => definition.name === 'platformToken')).toBe(false);
  });

  it('normalizes the local ThingsPanel frontend API fallback to the dev proxy endpoint', () => {
    const runtimeValues = buildEmbedRuntimeVariableValues(
      {
        platformApiBaseUrl: 'http://localhost:5002/api/v1',
        thingsvisApiBaseUrl: 'http://localhost:5002/thingsvis-api',
      },
      null,
    );

    expect(runtimeValues.platformApiBaseUrl).toBe('http://localhost:5002/proxy-default');

    expect(
      resolveEmbedRuntimeVariableValues(
        [
          {
            name: 'platformApiBaseUrl',
            type: 'string',
            defaultValue: 'http://localhost:5002/api/v1',
          },
        ],
        runtimeValues,
      ).platformApiBaseUrl,
    ).toBe('http://localhost:5002/proxy-default');
  });
});
