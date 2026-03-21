import type { ControlGroup, NodeSchemaType, WidgetControls } from '@thingsvis/schema';

export type FormatBrushSnapshot = {
  sourceType: string;
  baseStyle?: NodeSchemaType['baseStyle'];
  styleProps: Record<string, unknown>;
};

const EXCLUDED_GROUP_IDS = new Set(['content', 'data', 'platform', 'events']);
const EXCLUDED_GROUP_LABELS = new Set([
  'content',
  '内容',
  'data',
  '数据',
  'platform',
  '平台',
  'events',
  '事件',
]);
const EXCLUDED_PROP_PATHS = new Set(['_rotation']);

function cloneValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeLabel(label: ControlGroup['label']): string[] {
  if (!label) return [];
  if (typeof label === 'string') return [label.trim().toLowerCase()];
  return Object.values(label).map((value) => value.trim().toLowerCase());
}

function isStyleGroup(group: ControlGroup): boolean {
  const groupId = group.id.trim().toLowerCase();
  if (EXCLUDED_GROUP_IDS.has(groupId)) {
    return false;
  }

  const labels = normalizeLabel(group.label);
  return !labels.some((label) => EXCLUDED_GROUP_LABELS.has(label));
}

export function collectStylePropPaths(controls?: WidgetControls | null): string[] {
  if (!controls?.groups?.length) return [];

  const paths = new Set<string>();
  controls.groups.forEach((group) => {
    if (!isStyleGroup(group)) return;
    group.fields.forEach((field) => {
      if (!EXCLUDED_PROP_PATHS.has(field.path)) {
        paths.add(field.path);
      }
    });
  });

  return Array.from(paths);
}

export function createFormatBrushSnapshot(
  node: NodeSchemaType,
  controls?: WidgetControls | null,
): FormatBrushSnapshot {
  const props = (node.props ?? {}) as Record<string, unknown>;
  const styleProps = collectStylePropPaths(controls).reduce<Record<string, unknown>>(
    (acc, path) => {
      if (Object.prototype.hasOwnProperty.call(props, path)) {
        acc[path] = cloneValue(props[path]);
      }
      return acc;
    },
    {},
  );

  return {
    sourceType: node.type,
    baseStyle: node.baseStyle ? cloneValue(node.baseStyle) : undefined,
    styleProps,
  };
}

export function buildFormatBrushPatch(
  snapshot: FormatBrushSnapshot,
  targetNode: NodeSchemaType,
): Pick<NodeSchemaType, 'baseStyle' | 'props'> {
  const patch: Pick<NodeSchemaType, 'baseStyle' | 'props'> = {};

  if (snapshot.baseStyle && Object.keys(snapshot.baseStyle).length > 0) {
    patch.baseStyle = cloneValue(snapshot.baseStyle);
  }

  if (snapshot.sourceType === targetNode.type && Object.keys(snapshot.styleProps).length > 0) {
    patch.props = cloneValue(snapshot.styleProps);
  }

  return patch;
}
