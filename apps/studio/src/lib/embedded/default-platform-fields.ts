export type DefaultPlatformField = {
  id: string;
  name: string;
  alias: string;
  type: 'number' | 'string' | 'boolean' | 'json';
  dataType: 'attribute' | 'telemetry' | 'command' | 'event';
  unit?: string;
  description?: string;
  scopes: PlatformFieldScope[];
};

export type PlatformFieldScope = 'tenant' | 'super-admin' | 'all';

const PLATFORM_FIELD_SCOPE_ALIASES: Record<string, PlatformFieldScope> = {
  tenant: 'tenant',
  user: 'tenant',
  tenant_user: 'tenant',
  'tenant-user': 'tenant',
  admin: 'super-admin',
  superadmin: 'super-admin',
  super_admin: 'super-admin',
  'super-admin': 'super-admin',
  sysadmin: 'super-admin',
  system_admin: 'super-admin',
  'system-admin': 'super-admin',
  all: 'all',
};

// These fields make value-card and line-chart widgets bindable in embedded mode
// even before the host injects a richer field schema.
export const DEFAULT_AGGREGATE_PLATFORM_FIELDS: DefaultPlatformField[] = [
  {
    id: 'device_total',
    name: '设备总数',
    alias: '设备总数',
    type: 'number',
    dataType: 'telemetry',
    description: '首页聚合指标：设备总数',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_online',
    name: '在线设备数',
    alias: '在线设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '首页聚合指标：在线设备数',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_offline',
    name: '离线设备数',
    alias: '离线设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '首页聚合指标：离线设备数',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_activity',
    name: '激活设备数',
    alias: '激活设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '首页聚合指标：激活设备数',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'alarm_device_total',
    name: '告警设备数',
    alias: '告警设备数',
    type: 'number',
    dataType: 'telemetry',
    description: '首页聚合指标：当前处于告警状态的设备数',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'tenant_added_yesterday',
    name: '昨日新增租户',
    alias: '昨日新增租户',
    type: 'number',
    dataType: 'telemetry',
    description: '超管首页聚合指标：昨日新增租户数',
    scopes: ['super-admin'],
  },
  {
    id: 'tenant_added_month',
    name: '本月新增租户',
    alias: '本月新增租户',
    type: 'number',
    dataType: 'telemetry',
    description: '超管首页聚合指标：本月新增租户数',
    scopes: ['super-admin'],
  },
  {
    id: 'tenant_total',
    name: '租户总数',
    alias: '租户总数',
    type: 'number',
    dataType: 'telemetry',
    description: '超管首页聚合指标：租户总数',
    scopes: ['super-admin'],
  },
  {
    id: 'cpu_usage',
    name: 'CPU 使用率',
    alias: 'CPU 使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '超管首页聚合指标：CPU 当前使用率',
    scopes: ['super-admin'],
  },
  {
    id: 'memory_usage',
    name: '内存使用率',
    alias: '内存使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '超管首页聚合指标：内存当前使用率',
    scopes: ['super-admin'],
  },
  {
    id: 'disk_usage',
    name: '磁盘使用率',
    alias: '磁盘使用率',
    type: 'number',
    dataType: 'telemetry',
    unit: '%',
    description: '超管首页聚合指标：磁盘当前使用率',
    scopes: ['super-admin'],
  },
  {
    id: 'device_total__history',
    name: 'Total Devices Trend',
    alias: 'Total Devices Trend',
    type: 'json',
    dataType: 'telemetry',
    description: 'Embedded aggregate trend history for total devices.',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_activity__history',
    name: 'Active Devices Trend',
    alias: 'Active Devices Trend',
    type: 'json',
    dataType: 'telemetry',
    description: 'Embedded aggregate trend history for active devices.',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'alarm_device_total__history',
    name: 'Alarm Devices Trend',
    alias: 'Alarm Devices Trend',
    type: 'json',
    dataType: 'telemetry',
    description: 'Embedded aggregate trend history for alarm devices.',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_online__history',
    name: '在线设备趋势',
    alias: '在线设备趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '首页聚合趋势：在线设备数历史序列',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'device_offline__history',
    name: '离线设备趋势',
    alias: '离线设备趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '首页聚合趋势：离线设备数历史序列',
    scopes: ['tenant', 'super-admin'],
  },
  {
    id: 'tenant_growth__history',
    name: '租户增长趋势',
    alias: '租户增长趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '超管首页聚合趋势：租户新增历史序列',
    scopes: ['super-admin'],
  },
  {
    id: 'cpu_usage__history',
    name: 'CPU 趋势',
    alias: 'CPU 趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '超管首页聚合趋势：CPU 使用率历史序列',
    scopes: ['super-admin'],
  },
  {
    id: 'memory_usage__history',
    name: '内存趋势',
    alias: '内存趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '超管首页聚合趋势：内存使用率历史序列',
    scopes: ['super-admin'],
  },
  {
    id: 'disk_usage__history',
    name: '磁盘趋势',
    alias: '磁盘趋势',
    type: 'json',
    dataType: 'telemetry',
    description: '超管首页聚合趋势：磁盘使用率历史序列',
    scopes: ['super-admin'],
  },
];

export function normalizePlatformFieldScope(rawScope?: unknown): PlatformFieldScope {
  if (typeof rawScope !== 'string') return 'all';
  return PLATFORM_FIELD_SCOPE_ALIASES[rawScope.trim().toLowerCase()] ?? 'all';
}

export function getDefaultAggregatePlatformFields(
  scope: PlatformFieldScope = 'all',
): DefaultPlatformField[] {
  if (scope === 'all') return [...DEFAULT_AGGREGATE_PLATFORM_FIELDS];
  return DEFAULT_AGGREGATE_PLATFORM_FIELDS.filter((field) => field.scopes.includes(scope));
}

export function mergeWithDefaultAggregatePlatformFields<T extends { id: string }>(
  fields?: T[] | null,
  scope: PlatformFieldScope = 'all',
): Array<T | DefaultPlatformField> {
  const merged = new Map<string, T | DefaultPlatformField>();

  getDefaultAggregatePlatformFields(scope).forEach((field) => {
    merged.set(field.id, field);
  });

  (fields ?? []).forEach((field) => {
    merged.set(field.id, field);
  });

  return Array.from(merged.values());
}
