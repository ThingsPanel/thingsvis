import type { EmbeddedProviderCatalog } from '../embedded-data-source';

const zhEn = (zh: string, en: string) => ({ zh, en });

export const thingspanelCatalog: EmbeddedProviderCatalog = {
  provider: 'thingspanel',
  runtimeDeviceFields: [
    {
      id: 'is_online',
      label: zhEn('在线状态', 'Online Status'),
      alias: zhEn('在线状态', 'Online Status'),
      type: 'number',
    },
    {
      id: 'online_text',
      label: zhEn('状态描述', 'Status Text'),
      alias: zhEn('状态描述', 'Status Text'),
      type: 'string',
    },
    {
      id: 'online_status_updated_at',
      label: zhEn('状态更新时间', 'Status Updated At'),
      alias: zhEn('状态更新时间', 'Status Updated At'),
      type: 'number',
    },
  ],
  dataSources: [
    {
      id: 'thingspanel_device_summary',
      group: 'dashboard',
      label: zhEn('设备统计', 'Device Summary'),
      url: '{{ var.platformApiBaseUrl }}/board/trend',
      fields: [
        { id: 'device_total', label: zhEn('设备总数', 'Total Devices'), type: 'number' },
        { id: 'device_online', label: zhEn('在线设备数', 'Online Devices'), type: 'number' },
        { id: 'device_offline', label: zhEn('离线设备数', 'Offline Devices'), type: 'number' },
        { id: 'device_activity', label: zhEn('活跃设备数', 'Active Devices'), type: 'number' },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const points = Array.isArray(payload?.points) ? payload.points : Array.isArray(payload) ? payload : [];
const latest = points.length > 0 ? points[points.length - 1] : payload;
const total = Number(latest?.device_total ?? payload?.device_total ?? 0);
const online = Number(latest?.device_online ?? latest?.device_on ?? payload?.device_online ?? payload?.device_on ?? 0);
return {
  device_total: total,
  device_online: online,
  device_offline: Math.max(0, total - online),
  device_activity: online
};
`,
    },
    {
      id: 'thingspanel_alarm_summary',
      group: 'dashboard',
      label: zhEn('告警设备统计', 'Alarm Device Summary'),
      url: '{{ var.platformApiBaseUrl }}/alarm/device/counts',
      fields: [
        {
          id: 'alarm_device_total',
          label: zhEn('告警设备数', 'Alarm Device Count'),
          type: 'number',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
return { alarm_device_total: Number(payload?.alarm_device_total ?? 0) };
`,
    },
    {
      id: 'thingspanel_device_trend',
      group: 'dashboard',
      label: zhEn('设备在线趋势', 'Device Online Trend'),
      url: '{{ var.platformApiBaseUrl }}/board/trend',
      fields: [
        {
          id: 'device_total__history',
          label: zhEn('设备总数趋势', 'Total Device Trend'),
          type: 'array',
        },
        {
          id: 'device_online__history',
          label: zhEn('在线设备数趋势', 'Online Device Trend'),
          type: 'array',
        },
        {
          id: 'device_offline__history',
          label: zhEn('离线设备数趋势', 'Offline Device Trend'),
          type: 'array',
        },
        {
          id: 'device_activity__history',
          label: zhEn('活跃设备数趋势', 'Active Device Trend'),
          type: 'array',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const points = Array.isArray(payload?.points) ? payload.points : Array.isArray(payload) ? payload : [];
const mapSeries = (field) => points.map((point) => ({
  timestamp: point.timestamp ?? point.time ?? point.created_at,
  value: Number(point[field] ?? 0)
}));
return {
  device_total__history: mapSeries('device_total'),
  device_online__history: mapSeries('device_online'),
  device_offline__history: mapSeries('device_offline'),
  device_activity__history: mapSeries('device_online')
};
`,
    },
    {
      id: 'thingspanel_home_alarm_history',
      group: 'dashboard',
      label: zhEn('告警列表', 'Alarm List'),
      url: '{{ var.platformApiBaseUrl }}/alarm/info/history',
      params: { page: 1, page_size: 10 },
      fields: [
        { id: 'alarm_rows', label: zhEn('告警列表', 'Alarm Rows'), type: 'array' },
        { id: 'alarm_total', label: zhEn('告警总数', 'Alarm Total'), type: 'number' },
        {
          id: 'latest_alarm_level',
          label: zhEn('最新告警级别', 'Latest Alarm Level'),
          type: 'string',
        },
        {
          id: 'latest_alarm_title',
          label: zhEn('最新告警标题', 'Latest Alarm Title'),
          type: 'string',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload?.list)
  ? payload.list
  : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
// Normalize alarm level code to semantic string.
// ThingsPanel API uses: 1=critical/high, 2=warning/medium, 3=info/low (or string variants).
const normalizeLevel = (raw) => {
  const v = String(raw ?? '').toLowerCase().trim();
  if (v === '1' || v === 'critical' || v === 'high' || v === 'serious') return 'critical';
  if (v === '2' || v === 'warning' || v === 'medium' || v === 'warn') return 'warning';
  return 'info';
};
// Format ISO/timestamp to HH:mm local time.
const fmtTime = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(typeof raw === 'number' && raw < 1e12 ? raw * 1000 : raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return String(raw); }
};
const latest = rows[0] ?? null;
return {
  alarm_rows: rows.map((row) => ({
    level: normalizeLevel(row?.alarm_level ?? row?.level),
    title: String(row?.alarm_name ?? row?.name ?? row?.title ?? ''),
    detail: String(row?.alarm_description ?? row?.alarm_message ?? row?.message ?? row?.detail ?? ''),
    source: String(row?.device_name ?? row?.source ?? ''),
    time: fmtTime(row?.create_time ?? row?.created_at ?? row?.time),
  })),
  alarm_total: Number(payload?.total ?? rows.length ?? 0),
  latest_alarm_level: normalizeLevel(latest?.alarm_level ?? latest?.level),
  latest_alarm_title: String(latest?.alarm_name ?? latest?.name ?? latest?.title ?? ''),
};
`,
    },

    {
      id: 'thingspanel_home_latest_telemetry',
      group: 'dashboard',
      label: zhEn('最近数据上报', 'Latest Telemetry Uploads'),
      url: '{{ var.platformApiBaseUrl }}/device/telemetry/latest',
      fields: [
        {
          id: 'latest_devices',
          label: zhEn('最近活跃设备', 'Latest Active Devices'),
          type: 'array',
        },
        {
          id: 'latest_telemetry_rows',
          label: zhEn('最近上报数据', 'Latest Telemetry Rows'),
          type: 'array',
        },
        {
          id: 'latest_device_count',
          label: zhEn('最近活跃设备数', 'Latest Active Device Count'),
          type: 'number',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const devices = Array.isArray(payload) ? payload : [];
const latestDevices = devices.map((device) => ({
  device_id: device?.device_id ?? '',
  device_name: device?.device_name ?? '',
  is_online: Number(device?.is_online ?? 0),
  last_push_time: device?.last_push_time ?? '',
  telemetry_data: Array.isArray(device?.telemetry_data) ? device.telemetry_data : []
}));
const rows = latestDevices.flatMap((device) =>
  (Array.isArray(device.telemetry_data) ? device.telemetry_data : []).map((item) => ({
    device_id: device.device_id,
    device_name: device.device_name,
    key: item?.key ?? '',
    label: item?.label ?? item?.key ?? '',
    unit: item?.unit ?? '',
    value: item?.value,
    last_push_time: device.last_push_time,
    is_online: device.is_online
  }))
);
return {
  latest_devices: latestDevices,
  latest_telemetry_rows: rows,
  latest_device_count: latestDevices.length
};
`,
    },
    {
      id: 'thingspanel_current_device_telemetry_snapshot',
      group: 'current-device',
      label: zhEn('当前设备遥测值', 'Current Device Telemetry'),
      url: '{{ var.platformApiBaseUrl }}/telemetry/datas/current/{{ var.deviceId }}',
      fields: [],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.telemetry_data) ? payload.telemetry_data : [];
if (rows.length === 0 && payload && typeof payload === 'object' && !Array.isArray(payload)) {
  return payload;
}
return rows.reduce((acc, item) => {
  const key = item?.key ?? item?.id ?? item?.identifier;
  if (!key) return acc;
  acc[key] = item?.value;
  acc[String(key) + '__meta'] = {
    label: item?.label ?? item?.name ?? key,
    unit: item?.unit ?? '',
    ts: item?.ts ?? item?.timestamp ?? item?.time ?? ''
  };
  return acc;
}, {});
`,
    },
    {
      id: 'thingspanel_current_device_status_history',
      group: 'current-device-history',
      label: zhEn('设备在线状态变更记录', 'Device Online Status History'),
      url: '{{ var.platformApiBaseUrl }}/device/status/history',
      params: { device_id: '{{ var.deviceId }}', page: 1, page_size: 50 },
      fields: [
        {
          id: 'online_status_rows',
          label: zhEn('状态变更记录', 'Status Change Rows'),
          type: 'array',
        },
        {
          id: 'online_status_total',
          label: zhEn('状态变更次数', 'Status Change Count'),
          type: 'number',
        },
        {
          id: 'online_status__series',
          label: zhEn('在线状态变化趋势', 'Online Status Trend'),
          type: 'array',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload?.list) ? payload.list : Array.isArray(payload) ? payload : [];
return {
  online_status_rows: rows.map((row) => ({
    id: row?.id,
    device_id: row?.device_id ?? '',
    status: Number(row?.status ?? 0),
    status_text: Number(row?.status ?? 0) === 1 ? '在线' : '离线',
    change_time: row?.change_time ?? row?.created_at ?? row?.time ?? ''
  })),
  online_status_total: Number(payload?.total ?? rows.length ?? 0),
  online_status__series: rows.map((row) => ({
    timestamp: row?.change_time ?? row?.created_at ?? row?.time ?? '',
    value: Number(row?.status ?? 0)
  }))
};
`,
    },
    {
      id: 'thingspanel_current_device_alarm_history',
      group: 'current-device-history',
      label: zhEn('设备告警历史', 'Device Alarm History'),
      url: '{{ var.platformApiBaseUrl }}/alarm/info/history',
      params: { device_id: '{{ var.deviceId }}', page: 1, page_size: 10 },
      fields: [
        {
          id: 'device_alarm_rows',
          label: zhEn('设备告警列表', 'Device Alarm Rows'),
          type: 'array',
        },
        {
          id: 'device_alarm_total',
          label: zhEn('设备告警总数', 'Device Alarm Total'),
          type: 'number',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload?.list)
  ? payload.list
  : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
return {
  device_alarm_rows: rows.map((row) => ({
    id: row?.id,
    device_id: row?.device_id,
    device_name: row?.device_name ?? row?.name ?? '',
    level: row?.alarm_level ?? row?.level ?? '',
    status: row?.alarm_status ?? row?.status ?? '',
    message: row?.alarm_description ?? row?.alarm_message ?? row?.message ?? '',
    time: row?.create_time ?? row?.created_at ?? row?.time ?? ''
  })),
  device_alarm_total: Number(payload?.total ?? rows.length ?? 0)
};
`,
    },
    {
      id: 'thingspanel_tenant_summary',
      group: 'dashboard',
      label: zhEn('租户统计', 'Tenant Summary'),
      url: '{{ var.platformApiBaseUrl }}/board/tenant',
      fields: [
        { id: 'tenant_total', label: zhEn('租户总数', 'Tenant Total'), type: 'number' },
        {
          id: 'tenant_added_yesterday',
          label: zhEn('昨日新增租户', 'New Tenants Yesterday'),
          type: 'number',
        },
        {
          id: 'tenant_added_month',
          label: zhEn('本月新增租户', 'New Tenants This Month'),
          type: 'number',
        },
        {
          id: 'tenant_growth__history',
          label: zhEn('租户增长趋势', 'Tenant Growth Trend'),
          type: 'array',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const year = new Date().getFullYear();
const rows = Array.isArray(payload?.user_list_month) ? payload.user_list_month : [];
return {
  tenant_total: Number(payload?.user_total ?? 0),
  tenant_added_yesterday: Number(payload?.user_added_yesterday ?? 0),
  tenant_added_month: Number(payload?.user_added_month ?? 0),
  tenant_growth__history: rows.map((row) => ({
    timestamp: new Date(year, Number(row.mon ?? 1) - 1, 1).toISOString(),
    value: Number(row.num ?? 0)
  }))
};
`,
    },
    {
      id: 'thingspanel_system_metrics',
      group: 'dashboard',
      label: zhEn('系统资源', 'System Metrics'),
      url: '{{ var.platformApiBaseUrl }}/system/metrics/current',
      fields: [
        { id: 'cpu_usage', label: zhEn('CPU 占用率', 'CPU Usage'), type: 'number' },
        { id: 'memory_usage', label: zhEn('内存占用率', 'Memory Usage'), type: 'number' },
        { id: 'disk_usage', label: zhEn('磁盘占用率', 'Disk Usage'), type: 'number' },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
return {
  cpu_usage: Number(payload?.cpu_usage ?? 0),
  memory_usage: Number(payload?.memory_usage ?? 0),
  disk_usage: Number(payload?.disk_usage ?? 0)
};
`,
    },
    {
      id: 'thingspanel_system_metrics_trend',
      group: 'dashboard',
      label: zhEn('系统资源趋势', 'System Metric Trends'),
      url: '{{ var.platformApiBaseUrl }}/system/metrics/history',
      params: { hours: 24 },
      fields: [
        { id: 'cpu_usage__history', label: zhEn('CPU 占用趋势', 'CPU Usage Trend'), type: 'array' },
        {
          id: 'memory_usage__history',
          label: zhEn('内存占用趋势', 'Memory Usage Trend'),
          type: 'array',
        },
        {
          id: 'disk_usage__history',
          label: zhEn('磁盘占用趋势', 'Disk Usage Trend'),
          type: 'array',
        },
      ],
      transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload) ? payload : [];
const mapSeries = (usageKey, fallbackKey) => rows.map((row) => ({
  timestamp: row.timestamp ?? row.time ?? row.created_at,
  value: Number(row[usageKey] ?? row[fallbackKey] ?? 0)
}));
return {
  cpu_usage__history: mapSeries('cpu_usage', 'cpu'),
  memory_usage__history: mapSeries('memory_usage', 'memory'),
  disk_usage__history: mapSeries('disk_usage', 'disk')
};
`,
    },
  ],
};
