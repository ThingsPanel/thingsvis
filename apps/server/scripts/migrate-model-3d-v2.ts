import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type PrismaClientType = import('@prisma/client').PrismaClient;

type JsonRecord = Record<string, unknown>;
type DashboardRow = {
  id: string;
  name?: string;
  nodes: string;
};
type DashboardVersionRow = {
  id: string;
  dashboardId: string;
  version: number;
  nodes: string;
};

const dryRun = process.argv.includes('--dry-run');

const LEGACY_LABELS = [
  {
    legacyProp: 'labelValue_pv',
    id: 'label-pv',
    anchor: 'anchor_pv',
    title: '光伏系统',
    unit: 'MW',
  },
  {
    legacyProp: 'labelValue_storage',
    id: 'label-storage',
    anchor: 'anchor_storage',
    title: '储能系统',
    unit: '%',
  },
  {
    legacyProp: 'labelValue_substation',
    id: 'label-substation',
    anchor: 'anchor_substation',
    title: '变配电',
    unit: 'MW',
  },
  {
    legacyProp: 'labelValue_workshop',
    id: 'label-workshop',
    anchor: 'anchor_workshop',
    title: '生产车间',
    unit: 'MW',
  },
  {
    legacyProp: 'labelValue_pump',
    id: 'label-pump',
    anchor: 'anchor_pump',
    title: '水泵系统',
    unit: 'MW',
  },
] as const;

const LEGACY_PROP_KEYS = [
  ...LEGACY_LABELS.map((item) => item.legacyProp),
  'labelOffsetY',
  'pipeNamePrefix',
  'pipeFlowSpeed',
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const envText = readFileSync(envPath, 'utf8');
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) return;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseNodes(raw: string, owner: string): unknown[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`[skip] ${owner}: nodes JSON 解析失败`, error);
    return null;
  }
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeSceneLabels(props: JsonRecord) {
  if (Array.isArray(props.sceneLabels) && props.sceneLabels.length > 0) {
    return props.sceneLabels.map((raw, index) => {
      const item = isRecord(raw) ? raw : {};
      return {
        id: typeof item.id === 'string' && item.id ? item.id : `label-${index + 1}`,
        anchor: typeof item.anchor === 'string' ? item.anchor : '',
        title: typeof item.title === 'string' ? item.title : '',
        value:
          typeof item.value === 'string' || typeof item.value === 'number' ? item.value : '--',
        unit: typeof item.unit === 'string' ? item.unit : '',
        visible: typeof item.visible === 'boolean' ? item.visible : true,
        offsetX: normalizeNumber(item.offsetX, 0),
        offsetY: normalizeNumber(item.offsetY, 0.3),
        offsetZ: normalizeNumber(item.offsetZ, 0),
      };
    });
  }

  const fallbackOffsetY = normalizeNumber(props.labelOffsetY, 0.3);
  return LEGACY_LABELS.map((item) => ({
    id: item.id,
    anchor: item.anchor,
    title: item.title,
    value:
      typeof props[item.legacyProp] === 'string' || typeof props[item.legacyProp] === 'number'
        ? props[item.legacyProp]
        : '--',
    unit: item.unit,
    visible: true,
    offsetX: 0,
    offsetY: fallbackOffsetY,
    offsetZ: 0,
  }));
}

function normalizePipeFlowRules(props: JsonRecord) {
  if (Array.isArray(props.pipeFlowRules) && props.pipeFlowRules.length > 0) {
    return props.pipeFlowRules.map((raw, index) => {
      const item = isRecord(raw) ? raw : {};
      const matcherType =
        item.matcherType === 'contains' || item.matcherType === 'exact'
          ? item.matcherType
          : 'prefix';
      return {
        id: typeof item.id === 'string' && item.id ? item.id : `pipe-rule-${index + 1}`,
        matcherType,
        matcher: typeof item.matcher === 'string' ? item.matcher : '',
        color: typeof item.color === 'string' && item.color ? item.color : '#38bdf8',
        speed: normalizeNumber(item.speed, 1.8),
        visible: typeof item.visible === 'boolean' ? item.visible : true,
      };
    });
  }

  return [
    {
      id: 'pipe-energy',
      matcherType: 'prefix',
      matcher: typeof props.pipeNamePrefix === 'string' && props.pipeNamePrefix ? props.pipeNamePrefix : '能量线_',
      color: '#38bdf8',
      speed: normalizeNumber(props.pipeFlowSpeed, 1.8),
      visible: true,
    },
  ];
}

function migrateBindings(node: JsonRecord, labels: Array<{ anchor: string }>) {
  const bindings = Array.isArray(node.data) ? node.data : [];
  const legacyTargetMap = new Map<string, string>();
  LEGACY_LABELS.forEach((legacy) => {
    const labelIndex = labels.findIndex((label) => label.anchor === legacy.anchor);
    if (labelIndex >= 0) legacyTargetMap.set(legacy.legacyProp, `sceneLabels.${labelIndex}.value`);
  });

  node.data = bindings.map((raw) => {
    if (!isRecord(raw) || typeof raw.targetProp !== 'string') return raw;
    const nextTarget = legacyTargetMap.get(raw.targetProp);
    return nextTarget ? { ...raw, targetProp: nextTarget } : raw;
  });
}

function migrateNode(raw: unknown): { node: unknown; changed: boolean } {
  if (!isRecord(raw) || raw.type !== 'resources/model-3d') {
    return { node: raw, changed: false };
  }

  const props = isRecord(raw.props) ? { ...raw.props } : {};
  const labels = normalizeSceneLabels(props);
  const pipeRules = normalizePipeFlowRules(props);
  const nextProps: JsonRecord = {
    ...props,
    sceneLabels: labels,
    pipeFlowRules: pipeRules,
  };

  LEGACY_PROP_KEYS.forEach((key) => {
    delete nextProps[key];
  });

  const nextNode: JsonRecord = {
    ...raw,
    props: nextProps,
  };
  migrateBindings(nextNode, labels);

  return { node: nextNode, changed: JSON.stringify(nextNode) !== JSON.stringify(raw) };
}

async function migrateDashboards(prisma: PrismaClientType) {
  const rows: DashboardRow[] = await prisma.dashboard.findMany({
    select: { id: true, name: true, nodes: true },
  });
  let changedCount = 0;

  for (const row of rows) {
    const nodes = parseNodes(row.nodes, `dashboard ${row.id}`);
    if (!nodes) continue;

    let changed = false;
    const nextNodes = nodes.map((node) => {
      const result = migrateNode(node);
      changed = changed || result.changed;
      return result.node;
    });

    if (!changed) continue;
    changedCount += 1;
    console.log(`[dashboard] ${row.id} ${row.name ?? ''}`);
    if (!dryRun) {
      await prisma.dashboard.update({
        where: { id: row.id },
        data: { nodes: JSON.stringify(nextNodes) },
      });
    }
  }

  return changedCount;
}

async function migrateDashboardVersions(prisma: PrismaClientType) {
  const rows: DashboardVersionRow[] = await prisma.dashboardVersion.findMany({
    select: { id: true, dashboardId: true, version: true, nodes: true },
  });
  let changedCount = 0;

  for (const row of rows) {
    const nodes = parseNodes(row.nodes, `dashboard_version ${row.id}`);
    if (!nodes) continue;

    let changed = false;
    const nextNodes = nodes.map((node) => {
      const result = migrateNode(node);
      changed = changed || result.changed;
      return result.node;
    });

    if (!changed) continue;
    changedCount += 1;
    console.log(`[version] ${row.dashboardId} v${row.version} (${row.id})`);
    if (!dryRun) {
      await prisma.dashboardVersion.update({
        where: { id: row.id },
        data: { nodes: JSON.stringify(nextNodes) },
      });
    }
  }

  return changedCount;
}

async function main() {
  loadEnvFile();
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log(`[migrate-model-3d-v2] mode=${dryRun ? 'dry-run' : 'write'}`);
    const dashboardCount = await migrateDashboards(prisma);
    const versionCount = await migrateDashboardVersions(prisma);
    console.log(
      `[migrate-model-3d-v2] done dashboards=${dashboardCount} dashboard_versions=${versionCount}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[migrate-model-3d-v2] failed', error);
  process.exit(1);
});
