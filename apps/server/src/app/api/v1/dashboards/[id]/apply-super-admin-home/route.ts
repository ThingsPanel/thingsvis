import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { DEFAULT_DASHBOARD_CONFIGS } from '@/constants/default-dashboards';

type Params = { params: Promise<{ id: string }> };

const cardStyle = {
  background: { color: '#ffffff', opacity: 1 },
  border: { width: 1, color: '#e8edf5', style: 'solid', radius: 12 },
  shadow: { x: 0, y: 4, blur: 16, color: 'rgba(30,64,175,0.06)' },
  opacity: 1,
};

function valueCard(
  id: string,
  title: string,
  icon: string,
  iconBackgroundColor: string,
  expression: string,
  gridX: number,
  subtitle = '',
) {
  return {
    id,
    type: 'interaction/value-card',
    props: {
      title,
      value: 0,
      suffix: '',
      subtitle,
      trend: 0,
      precision: 0,
      icon,
      iconPosition: 'left',
      iconSize: 62,
      titleFontSize: 16,
      valueFontSize: 42,
      suffixFontSize: 14,
      subtitleFontSize: 13,
      titleColor: '#172033',
      valueColor: '#111827',
      subtitleColor: '#64748b',
      iconColor: '#ffffff',
      iconBackgroundColor,
      trendUpColor: '#2563eb',
      trendDownColor: '#ef4444',
      align: 'left',
    },
    baseStyle: cardStyle,
    data: [{ targetProp: 'value', expression }],
    grid: { x: gridX, y: 0, w: 6, h: 3, static: false, isDraggable: true, isResizable: true },
  };
}

function lineChart(
  id: string,
  title: string,
  color: string,
  expression: string,
  x: number,
  w: number,
) {
  return {
    id,
    type: 'chart/uplot-line',
    props: {
      primaryColor: color,
      showLegend: false,
      showArea: true,
      areaFillAlpha: 0.12,
      smooth: true,
      timeRangePreset: 'all',
      data: [],
    },
    baseStyle: cardStyle,
    data: [{ targetProp: 'data', expression }],
    grid: { x, y: 4, w, h: 5, static: false, isDraggable: true, isResizable: true },
  };
}

function sectionTitle(id: string, text: string, x: number, w: number) {
  return {
    id,
    type: 'basic/text',
    props: {
      text,
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'left',
      verticalAlign: 'middle',
      lineHeight: 1.4,
      letterSpacing: 0,
      textDecoration: 'none',
      fill: '#172033',
      opacity: 1,
      textShadowEnabled: false,
    },
    baseStyle: {
      background: { color: '#ffffff', opacity: 1 },
      border: { width: 1, color: '#e8edf5', style: 'solid', radius: 12 },
      opacity: 1,
      padding: 18,
    },
    grid: { x, y: 3, w, h: 1, static: false, isDraggable: true, isResizable: true },
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
  });
  if (!existing) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });

  const defaults = DEFAULT_DASHBOARD_CONFIGS.SUPER_ADMIN;
  const dataSources = (JSON.parse(defaults.dataSources) as Array<Record<string, unknown>>).filter(
    (source) => source.id !== 'thingspanel_system_metrics',
  );
  dataSources.push({
    id: 'thingspanel_system_metrics',
    name: '系统资源',
    type: 'REST',
    mode: 'auto',
    config: {
      url: '{{ var.platformApiBaseUrl }}/system/metrics/current',
      method: 'GET',
      headers: { 'x-token': '{{ var.platformToken }}' },
      params: {},
      pollingInterval: 60,
      timeout: 30,
      auth: { type: 'none' },
    },
    transformation:
      "const p=data?.data??data??{}; const cpu=Math.round(Number(p.cpu_usage??p.cpu??0)); return { cpu_usage:cpu, cpu_gauge:[{value:cpu,name:'CPU 使用率'}], memory_usage:Number(p.memory_usage??p.memory??0), disk_usage:Number(p.disk_usage??p.disk??0) };",
  });

  const nodes = [
    valueCard(
      'sa-tenant-total',
      '租户总数',
      'i-lucide:building-2',
      '#6366f1',
      '{{ ds.thingspanel_tenant_summary.data.tenant_total }}',
      0,
      '本月新增',
    ),
    valueCard(
      'sa-device-total',
      '设备总数',
      'i-lucide:server',
      '#ff9f2d',
      '{{ ds.device_sum.data.device_total }}',
      6,
    ),
    valueCard(
      'sa-device-online',
      '在线设备',
      'i-lucide:wifi',
      '#36bf7a',
      '{{ ds.device_sum.data.device_on }}',
      12,
      '在线率',
    ),
    valueCard(
      'sa-device-offline',
      '离线设备',
      'i-lucide:triangle-alert',
      '#ff4d4f',
      '{{ ds.device_sum.data.device_offline }}',
      18,
    ),
    sectionTitle('sa-cpu-title', 'CPU 使用率', 0, 5),
    sectionTitle('sa-memory-title', '内存使用率　　　　　　　　　近 24 小时', 5, 10),
    sectionTitle('sa-disk-title', '磁盘使用率　　　　　　近 24 小时', 15, 9),
    {
      id: 'sa-cpu-gauge',
      type: 'chart/echarts-gauge',
      props: {
        primaryColor: '#4f6ef7',
        axisLabelColor: '#64748b',
        detailColor: '#172033',
        max: 100,
        data: 0,
        axisLabelFontSize: 11,
        titleFontSize: 14,
        detailFontSize: 28,
      },
      baseStyle: cardStyle,
      data: [
        { targetProp: 'data', expression: '{{ ds.thingspanel_system_metrics.data.cpu_usage }}' },
      ],
      grid: { x: 0, y: 4, w: 5, h: 5, static: false, isDraggable: true, isResizable: true },
    },
    lineChart(
      'sa-memory-trend',
      '内存使用率　　近 24 小时',
      '#7c3aed',
      '{{ ds.thingspanel_system_metrics_trend.data.memory_usage__history }}',
      5,
      10,
    ),
    lineChart(
      'sa-disk-trend',
      '磁盘使用率　　近 24 小时',
      '#f59e0b',
      '{{ ds.thingspanel_system_metrics_trend.data.disk_usage__history }}',
      15,
      9,
    ),
    {
      id: 'sa-guidance',
      type: 'custom/guidance-steps',
      props: {
        themeColor: '#5b5fe9',
        titleFontSize: 16,
        descFontSize: 13,
        items: [
          {
            title: '创建租户',
            description: '创建租户并管理成员',
            linkText: '创建租户',
            linkUrl: '/system-management/tenant',
            target: '_top',
          },
          {
            title: '接入设备',
            description: '创建设备并接入平台',
            linkText: '设备管理',
            linkUrl: '/device/manage',
            target: '_top',
          },
          {
            title: '查看数据',
            description: '查看设备数据和运行状态',
            linkText: '可视化',
            linkUrl: '/visualization/thingsvis',
            target: '_top',
          },
        ],
      },
      baseStyle: cardStyle,
      grid: { x: 0, y: 9, w: 8, h: 6, static: false, isDraggable: true, isResizable: true },
    },
    {
      id: 'sa-help',
      type: 'interaction/quick-entry-list',
      props: {
        title: '智能问答与文档',
        showTitle: true,
        showDivider: true,
        titleFontSize: 18,
        itemTitleFontSize: 16,
        descriptionFontSize: 13,
        iconSize: 52,
        itemPadding: 16,
        textColor: '#172033',
        descriptionColor: '#64748b',
        dividerColor: '#e8edf5',
        hoverColor: '#f8faff',
        items: [
          {
            id: 'ai-chat',
            title: 'ThingsPanel 智能问答',
            description: '查询配置、接入和使用问题',
            icon: 'bot',
            iconColor: '#2563eb',
            iconBackgroundColor: '#eef2ff',
            url: 'https://aichat.thingspanel.cn/',
            target: '_blank',
            disabled: false,
          },
          {
            id: 'docs',
            title: '官方文档',
            description: '快速开始和操作手册',
            icon: 'book-open',
            iconColor: '#536dfe',
            iconBackgroundColor: '#f0f2ff',
            url: 'https://docs.thingspanel.cn/zh-Hans/',
            target: '_blank',
            disabled: false,
          },
          {
            id: 'open-source',
            title: '项目开源地址',
            description: '查看源码、提交问题和参与贡献',
            icon: 'github',
            iconColor: '#334155',
            iconBackgroundColor: '#f1f5f9',
            url: 'https://github.com/ThingsPanel/thingsvis',
            target: '_blank',
            disabled: false,
          },
        ],
      },
      baseStyle: cardStyle,
      grid: { x: 8, y: 9, w: 8, h: 6, static: false, isDraggable: true, isResizable: true },
    },
    {
      id: 'sa-system-info',
      type: 'basic/rich-text',
      props: {
        body: '系统信息\n\n平台名称　 ThingsPanel 物联网平台\n──────────────\n系统版本　 v1.0.0\n──────────────\n部署环境　 生产环境\n──────────────\n最近更新　 自动刷新',
        bodyFontSize: 15,
        lineHeight: 1.9,
        align: 'left',
        bodyColor: '#25324b',
        backgroundColor: '#ffffff',
        backgroundOpacity: 1,
        borderColor: '#e8edf5',
        borderWidth: 1,
        cornerRadius: 12,
        paddingSize: 20,
      },
      baseStyle: cardStyle,
      grid: { x: 16, y: 9, w: 8, h: 6, static: false, isDraggable: true, isResizable: true },
    },
  ];

  const canvasConfig = {
    mode: 'grid',
    width: 1500,
    height: 850,
    background: { color: '#f6f8fc', size: 'cover', repeat: 'no-repeat', attachment: 'scroll' },
    theme: 'dawn',
    scaleMode: 'fit-min',
    previewAlignY: 'start',
    gridCols: 24,
    gridRowHeight: 50,
    gridGap: 10,
    padding: 10,
    gridEnabled: true,
    gridSize: 20,
  };

  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: {
      canvasConfig: JSON.stringify(canvasConfig),
      nodes: JSON.stringify(nodes),
      dataSources: JSON.stringify(dataSources),
      variables: defaults.variables,
      version: { increment: 1 },
    },
  });
  return NextResponse.json({ id: dashboard.id, name: dashboard.name, version: dashboard.version });
}
