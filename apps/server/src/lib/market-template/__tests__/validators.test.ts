/**
 * Unit Tests for Market Template Export/Import Validators and Types
 */

import { describe, expect, it } from 'vitest';
import {
  DeviceBindingSchema,
  FieldBindingSchema,
  DashboardTemplateSnapshotSchema,
  ExportDashboardQuerySchema,
  ImportDashboardBodySchema,
  stripSensitiveFields,
  isGeneratedDataSourceId,
  isTemplateDeviceRef,
} from '../validators';

describe('DeviceBindingSchema', () => {
  it('accepts valid device binding', () => {
    const valid = {
      bindingKey: 'room-sensor',
      deviceTemplateKey: 'temperature-humidity-sensor',
      displayName: '温湿度传感器',
      required: true,
      allowMany: false,
    };
    expect(DeviceBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts minimal device binding', () => {
    const minimal = {
      bindingKey: 'sensor-1',
      deviceTemplateKey: 'sensor-template',
    };
    expect(DeviceBindingSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects bindingKey with uppercase', () => {
    const invalid = {
      bindingKey: 'RoomSensor',
      deviceTemplateKey: 'sensor-template',
    };
    expect(DeviceBindingSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects bindingKey starting with number', () => {
    const invalid = {
      bindingKey: '1-sensor',
      deviceTemplateKey: 'sensor-template',
    };
    expect(DeviceBindingSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects bindingKey with underscore', () => {
    const invalid = {
      bindingKey: 'room_sensor',
      deviceTemplateKey: 'sensor-template',
    };
    expect(DeviceBindingSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects deviceTemplateKey with uppercase', () => {
    const invalid = {
      bindingKey: 'sensor-1',
      deviceTemplateKey: 'SensorTemplate',
    };
    expect(DeviceBindingSchema.safeParse(invalid).success).toBe(false);
  });

  it('defaults required to true', () => {
    const result = DeviceBindingSchema.safeParse({
      bindingKey: 'sensor-1',
      deviceTemplateKey: 'sensor-template',
    });
    expect(result.success && result.data.required).toBe(true);
  });

  it('defaults allowMany to false', () => {
    const result = DeviceBindingSchema.safeParse({
      bindingKey: 'sensor-1',
      deviceTemplateKey: 'sensor-template',
    });
    expect(result.success && result.data.allowMany).toBe(false);
  });
});

describe('FieldBindingSchema', () => {
  it('accepts valid field binding', () => {
    const valid = {
      bindingKey: 'room-sensor',
      kind: 'telemetry',
      identifier: 'temperature',
      required: true,
    };
    expect(FieldBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts telemetry kind', () => {
    const valid = { bindingKey: 'sensor', kind: 'telemetry', identifier: 'temp' };
    expect(FieldBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts attribute kind', () => {
    const valid = { bindingKey: 'switch', kind: 'attribute', identifier: 'power' };
    expect(FieldBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts command kind', () => {
    const valid = { bindingKey: 'switch', kind: 'command', identifier: 'setPower' };
    expect(FieldBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts event kind', () => {
    const valid = { bindingKey: 'sensor', kind: 'event', identifier: 'alert' };
    expect(FieldBindingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid kind', () => {
    const invalid = { bindingKey: 'sensor', kind: 'invalid', identifier: 'temp' };
    expect(FieldBindingSchema.safeParse(invalid).success).toBe(false);
  });

  it('defaults required to true', () => {
    const result = FieldBindingSchema.safeParse({
      bindingKey: 'sensor',
      kind: 'telemetry',
      identifier: 'temp',
    });
    expect(result.success && result.data.required).toBe(true);
  });
});

describe('DashboardTemplateSnapshotSchema', () => {
  const validSnapshot = {
    resourceKey: 'smart-home-dashboard',
    version: '1.0.0',
    name: '智能家居看板',
    schemaVersion: 'thingsvis-1',
    canvasConfig: {},
    nodes: [],
    dataSources: [],
    variables: [],
    deviceBindings: [
      { bindingKey: 'room-sensor', deviceTemplateKey: 'temperature-humidity-sensor' },
    ],
    fieldBindings: [{ bindingKey: 'room-sensor', kind: 'telemetry', identifier: 'temperature' }],
  };

  it('accepts valid snapshot', () => {
    expect(DashboardTemplateSnapshotSchema.safeParse(validSnapshot).success).toBe(true);
  });

  it('accepts snapshot without fieldBindings', () => {
    const withoutFieldBindings = { ...validSnapshot, fieldBindings: undefined };
    expect(DashboardTemplateSnapshotSchema.safeParse(withoutFieldBindings).success).toBe(true);
  });

  it('rejects resourceKey with uppercase', () => {
    const invalid = { ...validSnapshot, resourceKey: 'SmartHomeDashboard' };
    expect(DashboardTemplateSnapshotSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects empty name', () => {
    const invalid = { ...validSnapshot, name: '' };
    expect(DashboardTemplateSnapshotSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const invalid = { ...validSnapshot, name: 'a'.repeat(101) };
    expect(DashboardTemplateSnapshotSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ExportDashboardQuerySchema', () => {
  it('accepts market-template export mode', () => {
    const result = ExportDashboardQuerySchema.safeParse({ exportMode: 'market-template' });
    expect(result.success && result.data.exportMode).toBe('market-template');
  });

  it('defaults exportMode to market-template', () => {
    const result = ExportDashboardQuerySchema.safeParse({});
    expect(result.success && result.data.exportMode).toBe('market-template');
  });

  it('rejects invalid export mode', () => {
    const result = ExportDashboardQuerySchema.safeParse({ exportMode: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts device binding hints', () => {
    const withHints = {
      exportMode: 'market-template',
      deviceBindingHints: [
        { bindingKey: 'sensor', deviceTemplateKey: 'sensor-template', deviceId: 'dev-123' },
      ],
    };
    expect(ExportDashboardQuerySchema.safeParse(withHints).success).toBe(true);
  });
});

describe('ImportDashboardBodySchema', () => {
  const validSnapshot = {
    resourceKey: 'test-dashboard',
    version: '1.0.0',
    name: 'Test Dashboard',
    schemaVersion: 'thingsvis-1',
    canvasConfig: {},
    nodes: [],
    dataSources: [],
    variables: [],
    deviceBindings: [{ bindingKey: 'sensor', deviceTemplateKey: 'sensor-template' }],
  };

  const validBody = {
    snapshot: validSnapshot,
    localDeviceBindings: [{ bindingKey: 'sensor', deviceId: 'dev-456' }],
  };

  it('accepts valid import body', () => {
    expect(ImportDashboardBodySchema.safeParse(validBody).success).toBe(true);
  });

  it('rejects empty localDeviceBindings', () => {
    const invalid = { ...validBody, localDeviceBindings: [] };
    expect(ImportDashboardBodySchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts name override', () => {
    const withName = { ...validBody, name: 'Custom Name' };
    expect(ImportDashboardBodySchema.safeParse(withName).success).toBe(true);
  });

  it('accepts projectId override', () => {
    const withProject = { ...validBody, projectId: 'proj-123' };
    expect(ImportDashboardBodySchema.safeParse(withProject).success).toBe(true);
  });
});

describe('stripSensitiveFields', () => {
  it('strips deviceId field', () => {
    const input = { deviceId: 'dev-123', name: 'Test' };
    const result = stripSensitiveFields(input);
    expect(result).toEqual({ deviceId: '[REDACTED]', name: 'Test' });
  });

  it('strips tenantId field', () => {
    const input = { tenantId: 'tenant-456', value: 42 };
    const result = stripSensitiveFields(input);
    expect(result).toEqual({ tenantId: '[REDACTED]', value: 42 });
  });

  it('strips shareToken field', () => {
    const input = { shareToken: 'abc-123', name: 'Dashboard' };
    const result = stripSensitiveFields(input);
    expect(result).toEqual({ shareToken: '[REDACTED]', name: 'Dashboard' });
  });

  it('handles nested objects', () => {
    const input = {
      config: {
        deviceId: 'dev-nested',
        secret: 'my-secret',
      },
    };
    const result = stripSensitiveFields(input);
    expect(result).toEqual({
      config: {
        deviceId: '[REDACTED]',
        secret: '[REDACTED]',
      },
    });
  });

  it('handles arrays', () => {
    const input = [
      { deviceId: 'dev-1', name: 'Device 1' },
      { deviceId: 'dev-2', name: 'Device 2' },
    ];
    const result = stripSensitiveFields(input);
    expect(result).toEqual([
      { deviceId: '[REDACTED]', name: 'Device 1' },
      { deviceId: '[REDACTED]', name: 'Device 2' },
    ]);
  });

  it('preserves non-sensitive fields', () => {
    const input = { name: 'Dashboard', nodes: [], config: { color: 'blue' } };
    const result = stripSensitiveFields(input);
    expect(result).toEqual(input);
  });

  it('handles null and undefined', () => {
    expect(stripSensitiveFields(null)).toBeNull();
    expect(stripSensitiveFields(undefined)).toBeUndefined();
  });
});

describe('isGeneratedDataSourceId', () => {
  it('returns true for platform data source IDs', () => {
    expect(isGeneratedDataSourceId('__platform_dev123__')).toBe(true);
    expect(isGeneratedDataSourceId('__platform_sensor_temp__')).toBe(true);
  });

  it('returns true for ThingsPanel data source IDs', () => {
    expect(isGeneratedDataSourceId('thingspanel_dev123')).toBe(true);
  });

  it('returns false for regular IDs', () => {
    expect(isGeneratedDataSourceId('ds-123')).toBe(false);
    expect(isGeneratedDataSourceId('my-data-source')).toBe(false);
  });
});

describe('isTemplateDeviceRef', () => {
  it('returns true for __template__', () => {
    expect(isTemplateDeviceRef('__template__')).toBe(true);
  });

  it('returns true for template platform DS ID', () => {
    expect(isTemplateDeviceRef('__platform___template____')).toBe(true);
  });

  it('returns false for real device IDs', () => {
    expect(isTemplateDeviceRef('dev-123')).toBe(false);
    expect(isTemplateDeviceRef('thingspanel_dev456')).toBe(false);
  });
});
