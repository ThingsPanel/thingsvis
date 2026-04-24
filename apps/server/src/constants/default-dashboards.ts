/**
 * Default Dashboard Configurations
 *
 * These constants define the default home dashboard configurations
 * that are initialized when SUPER_ADMIN or TENANT_ADMIN users register.
 */

export type DefaultDashboardRole = 'SUPER_ADMIN' | 'TENANT_ADMIN';

export interface DefaultDashboardConfig {
  projectName: string;
  dashboardName: string;
  canvasConfig: string;
  nodes: string;
  dataSources: string;
  variables: string;
}

export const DEFAULT_DASHBOARD_CONFIGS: Record<DefaultDashboardRole, DefaultDashboardConfig> = {
  SUPER_ADMIN: {
    projectName: '超管首页',
    dashboardName: '超管首页v1',
    canvasConfig: JSON.stringify({
      mode: 'grid',
      width: 1500,
      height: 1000,
      background: { color: '#f7fafc', size: 'cover', repeat: 'no-repeat', attachment: 'scroll' },
      theme: 'dawn',
      scaleMode: 'fit-min',
      previewAlignY: 'center',
      gridCols: 24,
      gridRowHeight: 50,
      gridGap: 5,
      gridEnabled: true,
      gridSize: 20,
    }),
    nodes: JSON.stringify([
      {
        id: 'de56f271-4e51-4e69-bc81-0058164d259e',
        type: 'chart/uplot-line',
        props: {
          title: '磁盘占用',
          titleAlign: 'left',
          primaryColor: '#6965db',
          showLegend: true,
          timeRangePreset: 'all',
          data: [],
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { width: 0, color: '#c0c0c0', style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 600, height: 220 },
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.thingspanel_system_metrics_trend.data.disk_usage__history }}',
          },
        ],
        grid: { x: 0, y: 3, w: 12, h: 7, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '9a4bdf25-78cc-476b-9e8b-79d81583eecf',
        type: 'interaction/value-card-simple',
        props: {
          title: '总设备数',
          value: 0,
          unit: '个',
          showUnit: true,
          precision: 0,
          showTrend: false,
          valueColor: 'auto',
          thresholds: '[]',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 160, height: 80 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_total }}',
          },
        ],
        grid: { x: 0, y: 0, w: 6, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'dc68f31a-2727-4c90-8219-69c0fab96739',
        type: 'interaction/value-card-simple',
        props: {
          title: '总在线数',
          value: 0,
          unit: '个',
          showUnit: true,
          precision: 0,
          showTrend: false,
          valueColor: 'auto',
          thresholds: '[]',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 20, y: 20 },
        size: { width: 160, height: 80 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_online }}',
          },
        ],
        grid: { x: 6, y: 0, w: 6, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'db3f0e48-720b-422f-8dd2-6628c766ecc9',
        type: 'interaction/value-card-simple',
        props: {
          title: '总离线数',
          value: 0,
          unit: '个',
          showUnit: true,
          precision: 0,
          showTrend: false,
          valueColor: 'auto',
          thresholds: '[]',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 40, y: 40 },
        size: { width: 160, height: 80 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_offline }}',
          },
        ],
        grid: { x: 12, y: 0, w: 6, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '3e98c169-5679-4102-a2f4-967ca47cf4f5',
        type: 'interaction/value-card-simple',
        props: {
          title: '租户总数',
          value: 0,
          unit: '个',
          showUnit: true,
          precision: 0,
          showTrend: true,
          valueColor: 'auto',
          thresholds: '[]',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 60, y: 60 },
        size: { width: 160, height: 80 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_tenant_summary.data.tenant_total }}',
          },
          {
            targetProp: 'trend',
            expression: '{{ ds.thingspanel_tenant_summary.data.tenant_added_month }}',
            transform: '(data.tenant_added_month / data.tenant_total).toFixed(2)*100',
          },
        ],
        grid: { x: 18, y: 0, w: 6, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '50440e62-8599-40c5-9f42-ca21b81d83aa',
        type: 'chart/uplot-line',
        props: {
          title: '内存占用',
          titleAlign: 'left',
          primaryColor: '#6965db',
          showLegend: true,
          timeRangePreset: 'all',
          data: [],
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          border: { width: 0, color: '#c0c0c0', style: 'solid', radius: 8 },
          opacity: 1,
        },
        position: { x: 20, y: 20 },
        size: { width: 600, height: 220 },
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.thingspanel_system_metrics_trend.data.memory_usage__history }}',
          },
        ],
        grid: { x: 12, y: 3, w: 12, h: 7, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '79521394-f416-4b1f-be7a-5844a7df4117',
        type: 'media/video-player',
        props: {
          src: 'https://pub-dd72232484fd4c78b094868481918d04.r2.dev/thingspanel-intro.mp4',
          mode: 'webrtc,mse,hls,mjpeg',
          background: false,
          visibilityThreshold: 0,
          objectFit: 'fill',
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        data: [],
        grid: { x: 0, y: 10, w: 12, h: 8, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'bfa90a38-5d22-4250-b21a-fd4f254a374e',
        type: 'media/iframe',
        props: {
          src: 'https://docs.thingspanel.cn/zh-Hans/',
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        data: [],
        grid: { x: 12, y: 10, w: 12, h: 8, static: false, isDraggable: true, isResizable: true },
      },
    ]),
    dataSources: JSON.stringify([
      {
        id: 'thingspanel_device_summary',
        name: 'thingspanel_device_summary',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/trend',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        name: 'thingspanel_alarm_summary',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/alarm/device/counts',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
return { alarm_device_total: Number(payload?.alarm_device_total ?? 0) };
`,
      },
      {
        id: 'thingspanel_device_trend',
        name: 'thingspanel_device_trend',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/trend',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        name: 'thingspanel_home_alarm_history',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/alarm/info/history',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: { page: 1, page_size: 10 },
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload?.list)
  ? payload.list
  : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
const normalizeLevel = (raw) => {
  const v = String(raw ?? '').toLowerCase().trim();
  if (v === '1' || v === 'critical' || v === 'high' || v === 'serious') return 'critical';
  if (v === '2' || v === 'warning' || v === 'medium' || v === 'warn') return 'warning';
  return 'info';
};
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
        name: 'thingspanel_home_latest_telemetry',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/device/telemetry/latest',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
const fmtTime = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(typeof raw === 'number' && raw < 1e12 ? raw * 1000 : raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return String(raw); }
};
const rows = latestDevices.flatMap((device) =>
  (Array.isArray(device.telemetry_data) ? device.telemetry_data : []).map((item) => ({
    name: device.device_name,
    metric: String(item?.label ?? item?.key ?? ''),
    value: item?.unit ? String(item.value ?? '') + ' ' + item.unit : String(item?.value ?? ''),
    time: fmtTime(device.last_push_time),
    device_id: device.device_id,
    key: item?.key ?? '',
    raw_value: item?.value,
    is_online: device.is_online,
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
        id: 'thingspanel_tenant_summary',
        name: 'thingspanel_tenant_summary',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/tenant',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        name: 'thingspanel_system_metrics',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/system/metrics/current',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        name: 'thingspanel_system_metrics_trend',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/system/metrics/history',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: { hours: 24 },
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
    ]),
    variables: JSON.stringify([
      { name: 'platformApiBaseUrl', type: 'string', defaultValue: 'http://localhost:5002/api/v1' },
      {
        name: 'thingsvisApiBaseUrl',
        type: 'string',
        defaultValue: 'http://localhost:5002/thingsvis-api',
      },
      { name: 'deviceId', type: 'string', defaultValue: '' },
      { name: 'dateRange', type: 'object', defaultValue: { startTime: '', endTime: '' } },
    ]),
  },

  TENANT_ADMIN: {
    projectName: '首页项目',
    dashboardName: '首页看板（租户管理员首页）',
    canvasConfig: JSON.stringify({
      mode: 'grid',
      width: 1920,
      height: 1080,
      background: { color: '#f7fafc', size: 'cover', repeat: 'no-repeat', attachment: 'scroll' },
      theme: 'dawn',
      scaleMode: 'fit-min',
      previewAlignY: 'center',
      gridCols: 12,
      gridRowHeight: 50,
      gridGap: 8,
      gridEnabled: true,
      gridSize: 20,
    }),
    nodes: JSON.stringify([
      {
        id: '68c9ec9d-6bd1-4528-bf74-6d8acce3a47f',
        type: 'interaction/value-card',
        props: {
          title: '设备总数',
          prefix: '',
          value: 0,
          suffix: '个',
          subtitle: '',
          trend: 0,
          precision: 0,
          icon: '',
          iconSize: 24,
          titleFontSize: 18,
          valueFontSize: 36,
          suffixFontSize: 20,
          subtitleFontSize: 12,
          titleColor: '#ffffff',
          valueColor: '#ffffff',
          subtitleColor: '',
          iconColor: '',
          iconBackgroundColor: '',
          trendUpColor: '',
          trendDownColor: '',
          align: 'left',
        },
        baseStyle: {
          background: { color: '#d64a92', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 320, height: 160 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_total }}',
          },
        ],
        grid: { x: 0, y: 0, w: 3, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'db8cfc25-a033-4d55-a1a0-3cd7a70604c8',
        type: 'interaction/value-card',
        props: {
          title: '离线设备数',
          prefix: '',
          value: 0,
          suffix: '个',
          subtitle: '',
          trend: 0,
          precision: 0,
          icon: '',
          iconSize: 24,
          titleFontSize: 18,
          valueFontSize: 36,
          suffixFontSize: 18,
          subtitleFontSize: 12,
          titleColor: '#ffffff',
          valueColor: '#ffffff',
          subtitleColor: '',
          iconColor: '',
          iconBackgroundColor: '',
          trendUpColor: '',
          trendDownColor: '',
          align: 'left',
        },
        baseStyle: {
          background: { color: '#62b8f9', opacity: 1 },
          opacity: 1,
        },
        position: { x: 20, y: 20 },
        size: { width: 320, height: 160 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_offline }}',
          },
        ],
        grid: { x: 3, y: 0, w: 3, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '31f83f00-47e8-46aa-80e7-cf30d9ac394e',
        type: 'interaction/value-card',
        props: {
          title: '在线设备数',
          prefix: '',
          value: 0,
          suffix: '个',
          subtitle: '',
          trend: 0,
          precision: 0,
          icon: '',
          iconSize: 24,
          titleFontSize: 18,
          valueFontSize: 36,
          suffixFontSize: 18,
          subtitleFontSize: 12,
          titleColor: '#ffffff',
          valueColor: '#ffffff',
          subtitleColor: '',
          iconColor: '',
          iconBackgroundColor: '',
          trendUpColor: '',
          trendDownColor: '',
          align: 'left',
        },
        baseStyle: {
          background: { color: '#7059d9', opacity: 1 },
          opacity: 1,
        },
        position: { x: 40, y: 40 },
        size: { width: 320, height: 160 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_device_summary.data.device_online }}',
          },
        ],
        grid: { x: 6, y: 0, w: 3, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'a0617113-530c-4aa1-8d34-ecc86718a0e1',
        type: 'interaction/value-card',
        props: {
          title: '告警设备数',
          prefix: '',
          value: 0,
          suffix: '个',
          subtitle: '',
          trend: 0,
          precision: 0,
          icon: '',
          iconSize: 24,
          titleFontSize: 18,
          valueFontSize: 36,
          suffixFontSize: 18,
          subtitleFontSize: 12,
          titleColor: '#ffffff',
          valueColor: '#ffffff',
          subtitleColor: '',
          iconColor: '',
          iconBackgroundColor: '',
          trendUpColor: '',
          trendDownColor: '',
          align: 'left',
        },
        baseStyle: {
          background: { color: '#ff5a34', opacity: 1 },
          opacity: 1,
        },
        position: { x: 60, y: 60 },
        size: { width: 320, height: 160 },
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.thingspanel_alarm_summary.data.alarm_device_total }}',
          },
        ],
        grid: { x: 9, y: 0, w: 3, h: 3, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'daa90ad4-ad55-4198-a9ac-6ded7535e3d3',
        type: 'chart/echarts-line',
        props: {
          title: '设备在线趋势',
          titleAlign: 'left',
          primaryColor: '',
          titleColor: '',
          axisLabelColor: '',
          showLegend: true,
          showXAxis: true,
          showYAxis: true,
          smooth: true,
          showArea: true,
          timeRangePreset: 'all',
          data: [
            { name: '00:00', value: 12 },
            { name: '06:00', value: 18 },
            { name: '12:00', value: 26 },
            { name: '18:00', value: 22 },
          ],
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 600, height: 220 },
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.thingspanel_device_trend.data.device_online__history }}',
          },
        ],
        grid: { x: 3, y: 3, w: 4, h: 4, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: '3101370d-f8b8-4b5b-8f87-ac550bcdfcff',
        type: 'custom/alert-list',
        props: {
          items: [],
          maxItems: 6,
          autoScroll: true,
          scrollSpeed: 'normal',
          showTime: true,
          showSource: true,
          showDetail: true,
          titleFontSize: 14,
          detailFontSize: 12,
          timeFontSize: 11,
          showTitle: true,
          title: '设备最新告警',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 340, height: 280 },
        data: [
          {
            targetProp: 'items',
            expression: '{{ ds.thingspanel_home_alarm_history.data.alarm_rows }}',
          },
        ],
        grid: { x: 9, y: 8, w: 3, h: 6, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'e14415ed-a914-486a-9e22-d49bb6d61c16',
        type: 'basic/table',
        props: {
          columns: [
            { key: 'name', title: '设备名称' },
            { key: 'metric', title: '指标' },
            { key: 'value', title: '数据值' },
            { key: 'time', title: '更新时间' },
          ],
          data: [],
          showHeader: true,
          headerFontSize: 14,
          headerWeight: '400',
          headerColor: '#ffffff',
          headerBgColor: '#6965db',
          bodyFontSize: 13,
          bodyWeight: '400',
          bodyColor: '#000000',
          showBorder: true,
          showStripe: true,
          stripeColor: 'auto',
          cellPadding: 11,
          showTitle: true,
          title: '设备最新上报',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 160 },
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.thingspanel_home_latest_telemetry.data.latest_telemetry_rows }}',
          },
        ],
        grid: { x: 3, y: 7, w: 6, h: 7, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'fa4e0bd8-240e-4fed-938e-0022ed78c812',
        type: 'chart/echarts-gauge',
        props: {
          title: ' ',
          primaryColor: '',
          titleColor: '',
          axisLabelColor: '',
          detailColor: '',
          max: 100,
          data: [{ name: 'CPU', value: 67 }],
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        data: [
          {
            targetProp: 'data',
            expression: '{{ ds.thingspanel_device_summary.data.device_total }}',
            transform:
              '{\nname: "设备在线率（%）",\nvalue: ((data.device_online / data.device_total)*100).toFixed(2)\n}',
          },
        ],
        grid: { x: 0, y: 3, w: 3, h: 4, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'ccefb744-fb6b-43a8-9a3f-1d0dcf9d9821',
        type: 'media/video-player',
        props: {
          src: 'https://pub-dd72232484fd4c78b094868481918d04.r2.dev/thingspanel-intro.mp4',
          mode: 'webrtc,mse,hls,mjpeg',
          background: false,
          visibilityThreshold: 0,
          objectFit: 'fill',
          borderWidth: 0,
          borderColor: '#000000',
          borderRadius: 0,
          showTitle: false,
          title: '产品介绍',
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        data: [],
        grid: { x: 9, y: 3, w: 3, h: 6, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'e2e02f34-ebde-4fb9-9bc7-752a54b52a54',
        type: 'custom/guidance-steps',
        props: {
          items: [
            {
              title: 'Create device',
              description:
                "Let's provision your first device to the platform via UI. Follow the documentation on how to do it:",
              linkText: 'Devices',
              linkUrl: '#',
              actionText: 'How to create Device',
              actionUrl: '#',
            },
            { title: 'Connect device' },
            { title: 'Create dashboard' },
          ],
          themeColor: '#6965db',
          finishText: '',
          titleFontSize: 16,
          descFontSize: 14,
        },
        baseStyle: {
          background: { color: '#ffffff', opacity: 1 },
          opacity: 1,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 600 },
        data: [],
        grid: { x: 0, y: 7, w: 3, h: 7, static: false, isDraggable: true, isResizable: true },
      },
      {
        id: 'f4cb7bc7-d9d3-4735-94eb-30baa20af069',
        type: 'media/image',
        props: {
          dataUrl: 'http://localhost:3000/api/v1/uploads/oqkna5Nbq8ciA4i-VSX2a.png',
          opacity: 1,
          objectFit: 'fill',
          cornerRadius: 0,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
        data: [],
        grid: { x: 7, y: 3, w: 2, h: 4, static: false, isDraggable: true, isResizable: true },
      },
    ]),
    dataSources: JSON.stringify([
      {
        id: 'thingspanel_home_alarm_history',
        name: 'thingspanel_home_alarm_history',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/alarm/info/history',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: { page: 1, page_size: 10 },
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
const rows = Array.isArray(payload?.list)
  ? payload.list
  : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
const normalizeLevel = (raw) => {
  const v = String(raw ?? '').toLowerCase().trim();
  if (v === '1' || v === 'critical' || v === 'high' || v === 'serious') return 'critical';
  if (v === '2' || v === 'warning' || v === 'medium' || v === 'warn') return 'warning';
  return 'info';
};
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
        createdAt: '2026-04-24T08:40:50.555Z',
        updatedAt: '2026-04-24T08:42:15.480Z',
        mode: 'auto',
      },
      {
        id: 'thingspanel_device_summary',
        name: '设备统计',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/trend',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        name: '告警设备统计',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/alarm/device/counts',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: `
const payload = data && typeof data === 'object' && data.data ? data.data : data;
return { alarm_device_total: Number(payload?.alarm_device_total ?? 0) };
`,
      },
      {
        id: 'thingspanel_system_metrics',
        name: '系统资源',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/system/metrics/current',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        id: 'thingspanel_device_trend',
        name: '设备在线趋势',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/trend',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        id: 'thingspanel_home_latest_telemetry',
        name: '最近数据上报',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/device/telemetry/latest',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
const fmtTime = (raw) => {
  if (!raw) return '';
  try {
    const d = new Date(typeof raw === 'number' && raw < 1e12 ? raw * 1000 : raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return String(raw); }
};
const rows = latestDevices.flatMap((device) =>
  (Array.isArray(device.telemetry_data) ? device.telemetry_data : []).map((item) => ({
    name: device.device_name,
    metric: String(item?.label ?? item?.key ?? ''),
    value: item?.unit ? String(item.value ?? '') + ' ' + item.unit : String(item?.value ?? ''),
    time: fmtTime(device.last_push_time),
    device_id: device.device_id,
    key: item?.key ?? '',
    raw_value: item?.value,
    is_online: device.is_online,
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
        id: 'thingspanel_tenant_summary',
        name: 'thingspanel_tenant_summary',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/board/tenant',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
        id: 'thingspanel_system_metrics_trend',
        name: 'thingspanel_system_metrics_trend',
        type: 'REST',
        config: {
          url: '{{ var.platformApiBaseUrl }}/system/metrics/history',
          method: 'GET',
          headers: { 'x-token': '{{ var.platformToken }}' },
          params: { hours: 24 },
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
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
    ]),
    variables: JSON.stringify([
      { name: 'platformApiBaseUrl', type: 'string', defaultValue: 'http://localhost:5002/api/v1' },
      {
        name: 'thingsvisApiBaseUrl',
        type: 'string',
        defaultValue: 'http://localhost:5002/thingsvis-api',
      },
      { name: 'deviceId', type: 'string', defaultValue: '' },
      { name: 'dateRange', type: 'object', defaultValue: { startTime: '', endTime: '' } },
    ]),
  },
};
