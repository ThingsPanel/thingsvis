import type { DashboardVariable } from '@thingsvis/kernel';

type ActionLike = {
  type?: unknown;
  variableName?: unknown;
  value?: unknown;
};

type EventLike = {
  actions?: unknown;
};

type NodeLike = {
  events?: unknown;
};

const VARIABLE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function isValidVariableName(name: string): boolean {
  return VARIABLE_NAME_RE.test(name);
}

function defaultForType(type: DashboardVariable['type']): unknown {
  switch (type) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
    case 'string':
    default:
      return '';
  }
}

export function inferVariableType(value: unknown): DashboardVariable['type'] {
  if (typeof value !== 'string') {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (isRecord(value)) return 'object';
    return 'string';
  }

  const trimmed = value.trim();
  if (!trimmed) return 'string';
  if (trimmed === 'true' || trimmed === 'false') return 'boolean';
  if (/^Number\s*\(/.test(trimmed) || /^[-+]?\d+(\.\d+)?$/.test(trimmed)) return 'number';
  if (trimmed.startsWith('[')) return 'array';
  if (trimmed.startsWith('{') || trimmed.startsWith('({')) return 'object';
  return 'string';
}

export function createVariableDefinition(name: string, value?: unknown): DashboardVariable | null {
  const normalizedName = name.trim();
  if (!isValidVariableName(normalizedName)) return null;

  const type = inferVariableType(value);
  return {
    name: normalizedName,
    type,
    defaultValue: defaultForType(type),
  };
}

export function collectSetVariableDefinitions(nodes: unknown[]): DashboardVariable[] {
  const definitions: DashboardVariable[] = [];
  const seen = new Set<string>();

  nodes.forEach((node) => {
    if (!isRecord(node)) return;

    const events = (node as NodeLike).events;
    if (!Array.isArray(events)) return;

    events.forEach((event) => {
      if (!isRecord(event)) return;
      const actions = (event as EventLike).actions;
      if (!Array.isArray(actions)) return;

      actions.forEach((rawAction) => {
        if (!isRecord(rawAction)) return;
        const action = rawAction as ActionLike;
        if (action.type !== 'setVariable' || typeof action.variableName !== 'string') return;

        const definition = createVariableDefinition(action.variableName, action.value);
        if (!definition || seen.has(definition.name)) return;

        seen.add(definition.name);
        definitions.push(definition);
      });
    });
  });

  return definitions;
}

export function mergeActionVariableDefinitions(
  currentDefinitions: DashboardVariable[] | undefined,
  nodes: unknown[] | undefined,
): DashboardVariable[] {
  const base = Array.isArray(currentDefinitions) ? currentDefinitions : [];
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const existingNames = new Set(base.map((definition) => definition.name));
  const additions = collectSetVariableDefinitions(nodeList).filter(
    (definition) => !existingNames.has(definition.name),
  );

  return additions.length > 0 ? [...base, ...additions] : base;
}
