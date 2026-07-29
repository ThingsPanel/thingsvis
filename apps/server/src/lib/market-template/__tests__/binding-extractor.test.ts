/**
 * Unit Tests for Device Binding Extraction
 */

import { describe, expect, it } from 'vitest';
import {
  extractDeviceBindings,
  validateDeviceBindings,
  validateFieldBindings,
} from '../binding-extractor';
import type { DeviceBindingInput, FieldBindingInput } from '../validators';

describe('extractDeviceBindings', () => {
  it('extracts device bindings from template data sources with hints', () => {
    const dashboard = {
      nodes: [
        {
          id: 'node-1',
          type: 'chart',
          data: [
            {
              targetProp: 'data',
              expression: '{{ ds.__device_platform_template__.data.temperature }}',
            },
          ],
        },
      ],
      dataSources: [
        {
          id: '__device_platform_template__',
          type: 'PLATFORM_FIELD',
          config: { deviceId: '__template__', source: 'platform' },
        },
      ],
      variables: [],
    };

    const bindingHints = [
      { bindingKey: 'room-sensor', deviceTemplateKey: 'temperature-humidity-sensor' },
    ];

    const result = extractDeviceBindings(dashboard, bindingHints, ['temperature-humidity-sensor']);

    expect(result.deviceBindings.length).toBeGreaterThanOrEqual(1);
    const sensorBinding = result.deviceBindings.find((db) => db.bindingKey === 'room-sensor');
    expect(sensorBinding).toBeDefined();
    expect(sensorBinding?.deviceTemplateKey).toBe('temperature-humidity-sensor');
  });

  it('extracts device bindings from platform IDs with binding keys', () => {
    const dashboard = {
      nodes: [
        {
          id: 'node-1',
          data: [{ expression: '{{ ds.__platform___sensor-1__.data.temp }}' }],
        },
        {
          id: 'node-2',
          data: [{ expression: '{{ ds.__platform___switch-1__.data.power }}' }],
        },
      ],
      dataSources: [
        {
          id: '__platform___sensor-1__',
          type: 'PLATFORM_FIELD',
          config: { deviceId: 'dev-sensor-1' },
        },
        {
          id: '__platform___switch-1__',
          type: 'PLATFORM_FIELD',
          config: { deviceId: 'dev-switch-1' },
        },
      ],
      variables: [],
    };

    const bindingHints = [
      { bindingKey: 'sensor-1', deviceTemplateKey: 'temperature-sensor', deviceId: 'dev-sensor-1' },
      { bindingKey: 'switch-1', deviceTemplateKey: 'switch', deviceId: 'dev-switch-1' },
    ];

    const result = extractDeviceBindings(dashboard, bindingHints, ['temperature-sensor', 'switch']);

    expect(result.deviceBindings.length).toBeGreaterThanOrEqual(1);
  });

  it('marks unbound devices without hints when they have real device IDs', () => {
    const dashboard = {
      nodes: [
        {
          id: 'node-1',
          data: [{ expression: '{{ ds.real_device_123.data.temp }}' }],
        },
      ],
      dataSources: [
        {
          id: 'real_device_123',
          type: 'PLATFORM_FIELD',
          config: { deviceId: 'real-device-123' },
        },
      ],
      variables: [],
    };

    // No binding hints for the real device
    const result = extractDeviceBindings(dashboard, [], []);

    expect(result.unboundDataSources).toContain('real_device_123');
    expect(result.warnings.some((w) => w.includes('no binding hint'))).toBe(true);
  });

  it('extracts field bindings from expressions', () => {
    const dashboard = {
      nodes: [
        {
          id: 'node-1',
          data: [
            { expression: '{{ ds.__device_platform_template__.data.temperature }}' },
            { expression: '{{ ds.__device_platform_template__.data.humidity }}' },
          ],
        },
      ],
      dataSources: [
        {
          id: '__device_platform_template__',
          type: 'PLATFORM_FIELD',
          config: { deviceId: '__template__' },
        },
      ],
      variables: [],
    };

    const result = extractDeviceBindings(
      dashboard,
      [{ bindingKey: 'sensor', deviceTemplateKey: 'temp' }],
      [],
    );

    expect(result.fieldBindings.length).toBeGreaterThan(0);
  });

  it('skips non-platform data sources', () => {
    const dashboard = {
      nodes: [],
      dataSources: [
        {
          id: 'rest-api-1',
          type: 'REST',
          config: { url: 'http://api.example.com' },
        },
        {
          id: '__device_platform_template__',
          type: 'PLATFORM_FIELD',
          config: { deviceId: '__template__' },
        },
      ],
      variables: [],
    };

    const bindingHints = [{ bindingKey: 'sensor', deviceTemplateKey: 'sensor-template' }];
    const result = extractDeviceBindings(dashboard, bindingHints, ['sensor-template']);

    // Should only extract the PLATFORM_FIELD data source
    expect(result.deviceBindings.some((db) => db.bindingKey === 'sensor')).toBe(true);
  });
});

describe('validateDeviceBindings', () => {
  it('accepts valid device bindings', () => {
    const bindings: DeviceBindingInput[] = [
      { bindingKey: 'sensor-1', deviceTemplateKey: 'temperature-sensor', required: true },
      { bindingKey: 'switch-1', deviceTemplateKey: 'switch', required: true, allowMany: true },
    ];

    const result = validateDeviceBindings(bindings);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects duplicate bindingKeys', () => {
    const bindings: DeviceBindingInput[] = [
      { bindingKey: 'sensor-1', deviceTemplateKey: 'temp-sensor', required: true },
      { bindingKey: 'sensor-1', deviceTemplateKey: 'humidity-sensor', required: true },
    ];

    const result = validateDeviceBindings(bindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects invalid bindingKey format', () => {
    const bindings: DeviceBindingInput[] = [
      { bindingKey: 'Invalid_Key', deviceTemplateKey: 'sensor', required: true },
    ];

    const result = validateDeviceBindings(bindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('bindingKey'))).toBe(true);
  });

  it('rejects invalid deviceTemplateKey format', () => {
    const bindings: DeviceBindingInput[] = [
      { bindingKey: 'sensor-1', deviceTemplateKey: 'Invalid_Template', required: true },
    ];

    const result = validateDeviceBindings(bindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('deviceTemplateKey'))).toBe(true);
  });

  it('accepts bindingKey with hyphens', () => {
    const bindings: DeviceBindingInput[] = [
      {
        bindingKey: 'room-temperature-sensor',
        deviceTemplateKey: 'sensor-template',
        required: true,
      },
    ];

    const result = validateDeviceBindings(bindings);
    expect(result.valid).toBe(true);
  });
});

describe('validateFieldBindings', () => {
  const deviceBindings: DeviceBindingInput[] = [
    { bindingKey: 'sensor-1', deviceTemplateKey: 'temperature-sensor', required: true },
    { bindingKey: 'switch-1', deviceTemplateKey: 'switch', required: true },
  ];

  it('accepts valid field bindings', () => {
    const fieldBindings: FieldBindingInput[] = [
      { bindingKey: 'sensor-1', kind: 'telemetry', identifier: 'temperature', required: true },
      { bindingKey: 'sensor-1', kind: 'telemetry', identifier: 'humidity', required: false },
      { bindingKey: 'switch-1', kind: 'attribute', identifier: 'power', required: true },
      { bindingKey: 'switch-1', kind: 'command', identifier: 'setPower', required: true },
    ];

    const result = validateFieldBindings(fieldBindings, deviceBindings);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects field binding with unknown bindingKey', () => {
    const fieldBindings: FieldBindingInput[] = [
      { bindingKey: 'unknown-sensor', kind: 'telemetry', identifier: 'temp', required: true },
    ];

    const result = validateFieldBindings(fieldBindings, deviceBindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown bindingKey'))).toBe(true);
  });

  it('rejects field binding with invalid kind', () => {
    const fieldBindings: FieldBindingInput[] = [
      { bindingKey: 'sensor-1', kind: 'invalid' as any, identifier: 'temp', required: true },
    ];

    const result = validateFieldBindings(fieldBindings, deviceBindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid kind'))).toBe(true);
  });

  it('rejects field binding with empty identifier', () => {
    const fieldBindings: FieldBindingInput[] = [
      { bindingKey: 'sensor-1', kind: 'telemetry', identifier: '', required: true },
    ];

    const result = validateFieldBindings(fieldBindings, deviceBindings);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('empty identifier'))).toBe(true);
  });

  it('accepts all valid field kinds', () => {
    const kinds: Array<FieldBindingInput['kind']> = ['telemetry', 'attribute', 'command', 'event'];

    for (const kind of kinds) {
      const fieldBindings: FieldBindingInput[] = [
        { bindingKey: 'sensor-1', kind, identifier: 'test-field', required: true },
      ];

      const result = validateFieldBindings(fieldBindings, deviceBindings);
      expect(result.valid).toBe(true);
    }
  });
});
