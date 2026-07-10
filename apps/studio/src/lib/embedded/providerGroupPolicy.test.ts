import { describe, expect, it } from 'vitest';
import {
  getDataSourceProviderGroups,
  isFieldPickerProviderGroupVisible,
} from './providerGroupPolicy';
import {
  listEmbeddedProviderDataSourceIds,
  resolveEmbeddedProviderCatalog,
} from './embedded-data-source-registry';

describe('embedded provider group policy', () => {
  it('excludes dashboard system sources from device template data-source center, but shows them in field picker', () => {
    // 数据源中心仍不自动注册 dashboard 系统源
    expect(getDataSourceProviderGroups('device-template')).toEqual([
      'current-device',
      'current-device-history',
    ]);
    // 字段选择器对物模型暴露全部 group（含系统数据）
    expect(isFieldPickerProviderGroupVisible('device-template', 'dashboard')).toBe(true);
    expect(isFieldPickerProviderGroupVisible('device-template', 'current-device')).toBe(true);

    const catalog = resolveEmbeddedProviderCatalog('thingspanel');
    const dashboardIds = new Set(
      catalog?.dataSources
        .filter((source) => source.group === 'dashboard')
        .map((source) => source.id),
    );
    const templateIds = listEmbeddedProviderDataSourceIds('thingspanel', {
      groups: getDataSourceProviderGroups('device-template'),
    });
    expect(templateIds.some((id) => dashboardIds.has(id))).toBe(false);
    expect(templateIds.length).toBeGreaterThan(0);
  });

  it('keeps dashboard and current-device contexts on their existing scopes', () => {
    expect(getDataSourceProviderGroups('dashboard')).toEqual(['dashboard']);
    expect(isFieldPickerProviderGroupVisible('dashboard', 'dashboard')).toBe(true);
    expect(getDataSourceProviderGroups('current-device')).toBeUndefined();
    expect(isFieldPickerProviderGroupVisible('current-device', 'dashboard')).toBe(true);
  });
});
