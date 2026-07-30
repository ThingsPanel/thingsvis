import { describe, expect, it } from 'vitest';
import {
  analyzeMarketDashboard,
  exportMarketDashboard,
  importMarketDashboard,
  type MarketDashboardSnapshot,
} from './market-dashboard-template';

function singleDeviceDashboard(): MarketDashboardSnapshot {
  return {
    name: 'Temperature Dashboard',
    schemaVersion: 'thingsvis-1',
    canvasConfig: {},
    nodes: [
      {
        id: 'temperature-card',
        expression: '{{ ds.__platform_device-100__.data.temperature }}',
      },
    ],
    dataSources: [
      {
        id: '__platform_device-100__',
        name: 'Workshop Sensor',
        type: 'PLATFORM_FIELD',
        config: {
          source: 'platform',
          deviceId: 'device-100',
          requestedFields: ['temperature'],
          fieldMappings: {},
        },
      },
    ],
    variables: [],
  };
}

describe('market dashboard template transformation', () => {
  it('analyzes device and field references', () => {
    expect(analyzeMarketDashboard(singleDeviceDashboard())).toEqual([
      {
        sourceDeviceId: 'device-100',
        sourceDeviceName: 'Workshop Sensor',
        dataSourceIds: ['__platform_device-100__'],
        fieldIdentifiers: ['temperature'],
      },
    ]);
  });

  it('normalizes runtime history fields to thing model identifiers', () => {
    const dashboard = singleDeviceDashboard();
    dashboard.nodes.push({
      id: 'humidity-history',
      expression: '{{ ds.__platform_device-100__.data.humidity__history }}',
    });

    expect(analyzeMarketDashboard(dashboard)[0]?.fieldIdentifiers).toEqual([
      'humidity',
      'temperature',
    ]);
  });

  it('exports without source device IDs and imports with a local device', () => {
    const exported = exportMarketDashboard(singleDeviceDashboard(), [
      {
        sourceDeviceId: 'device-100',
        bindingKey: 'temperature_sensor',
        displayName: 'Temperature Sensor',
      },
    ]).snapshot;

    expect(JSON.stringify(exported)).not.toContain('device-100');
    expect(exported.dataSources).toEqual([
      {
        id: '__platform_binding_temperature_sensor__',
        name: 'Workshop Sensor',
        type: 'PLATFORM_FIELD',
        config: {
          source: 'platform',
          requestedFields: ['temperature'],
          fieldMappings: {},
          deviceBinding: { $deviceBinding: 'temperature_sensor' },
        },
      },
    ]);

    const imported = importMarketDashboard(exported, [
      { bindingKey: 'temperature_sensor', localDeviceId: 'local-device-900' },
    ]);

    expect(JSON.stringify(imported)).not.toContain('$deviceBinding');
    expect(imported.nodes).toEqual([
      {
        id: 'temperature-card',
        expression: '{{ ds.__platform_local-device-900__.data.temperature }}',
      },
    ]);
    expect(imported.dataSources).toEqual([
      {
        id: '__platform_local-device-900__',
        name: 'Workshop Sensor',
        type: 'PLATFORM_FIELD',
        config: {
          source: 'platform',
          requestedFields: ['temperature'],
          fieldMappings: {},
          deviceId: 'local-device-900',
        },
      },
    ]);
  });

  it('supports two roles while keeping one dashboard snapshot', () => {
    const dashboard = singleDeviceDashboard();
    dashboard.nodes.push({
      id: 'switch',
      expression: '{{ ds.__platform_switch-200__.data.setPower }}',
    });
    dashboard.dataSources.push({
      id: '__platform_switch-200__',
      name: 'Exhaust Switch',
      type: 'PLATFORM_FIELD',
      config: {
        source: 'platform',
        deviceId: 'switch-200',
        requestedFields: ['setPower'],
        fieldMappings: {},
      },
    });

    const exported = exportMarketDashboard(dashboard, [
      { sourceDeviceId: 'device-100', bindingKey: 'temperature_sensor' },
      { sourceDeviceId: 'switch-200', bindingKey: 'power_switch' },
    ]);

    expect(exported.deviceReferences).toHaveLength(2);
    expect(exported.snapshot.dataSources).toHaveLength(2);

    const imported = importMarketDashboard(exported.snapshot, [
      { bindingKey: 'temperature_sensor', localDeviceId: 'sensor-local' },
      { bindingKey: 'power_switch', localDeviceId: 'switch-local' },
    ]);
    expect(JSON.stringify(imported)).toContain('__platform_sensor-local__');
    expect(JSON.stringify(imported)).toContain('__platform_switch-local__');
  });

  it('rejects export when any device role is missing', () => {
    expect(() => exportMarketDashboard(singleDeviceDashboard(), [])).toThrow(
      'Missing role mapping for device "device-100"',
    );
  });

  it('rejects import when any binding is missing', () => {
    const exported = exportMarketDashboard(singleDeviceDashboard(), [
      { sourceDeviceId: 'device-100', bindingKey: 'temperature_sensor' },
    ]).snapshot;

    expect(() => importMarketDashboard(exported, [])).toThrow(
      'Missing device binding "temperature_sensor"',
    );
  });

  it('rejects bindings that are not declared by the dashboard snapshot', () => {
    const exported = exportMarketDashboard(singleDeviceDashboard(), [
      { sourceDeviceId: 'device-100', bindingKey: 'temperature_sensor' },
    ]).snapshot;

    expect(() =>
      importMarketDashboard(exported, [
        { bindingKey: 'temperature_sensor', localDeviceId: 'local-device-900' },
        { bindingKey: 'unexpected_device', localDeviceId: 'local-device-901' },
      ]),
    ).toThrow('Unknown device binding "unexpected_device"');
  });
});
