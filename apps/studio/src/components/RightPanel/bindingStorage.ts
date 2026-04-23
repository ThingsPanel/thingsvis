import type { DataBinding } from '@thingsvis/schema';

export type BindingMode = 'static' | 'field' | 'expr';

export type FieldBindingSelection = {
  dataSourceId: string;
  fieldPath: string;
  transform?: string;
};

const FIELD_BINDING_EXPR_RE = /^\{\{\s*ds\.([^.\s]+)\.data(?:\.(.+?))?\s*\}\}$/;

export function isValidExpression(expression: string): boolean {
  return /^\{\{.*\}\}$/.test(expression.trim());
}

export function parseFieldBindingExpression(expression: string): FieldBindingSelection | null {
  const trimmed = expression.trim();

  // Check for regular data source expression: {{ ds.<id>.data.<path> }}
  const match = FIELD_BINDING_EXPR_RE.exec(trimmed);
  if (!match) return null;
  const dataSourceId = match[1];
  const fieldPath = match[2] ?? '(root)'; // 没有路径时表示根级别
  if (!dataSourceId) return null;
  return { dataSourceId, fieldPath };
}

export function makeFieldBindingExpression(selection: FieldBindingSelection): string {
  // (root) 表示选择整个数据，不添加字段路径
  if (selection.fieldPath === '(root)' || !selection.fieldPath) {
    return `{{ ds.${selection.dataSourceId}.data }}`;
  }
  return `{{ ds.${selection.dataSourceId}.data.${selection.fieldPath} }}`;
}

export function getBinding(
  bindings: DataBinding[] | undefined,
  targetProp: string,
): DataBinding | undefined {
  return (bindings ?? []).find((b) => b.targetProp === targetProp);
}

export function upsertBinding(
  bindings: DataBinding[] | undefined,
  next: DataBinding,
): DataBinding[] {
  const prev = bindings ?? [];
  const idx = prev.findIndex((b) => b.targetProp === next.targetProp);
  if (idx === -1) return [...prev, next];
  const copy = prev.slice();
  copy[idx] = next;
  return copy;
}

export function removeBinding(
  bindings: DataBinding[] | undefined,
  targetProp: string,
): DataBinding[] {
  return (bindings ?? []).filter((b) => b.targetProp !== targetProp);
}

export function detectBindingMode(
  bindings: DataBinding[] | undefined,
  targetProp: string,
): BindingMode {
  const binding = getBinding(bindings, targetProp);
  if (!binding) return 'static';
  const isField = parseFieldBindingExpression(binding.expression || '');
  return isField ? 'field' : 'expr';
}
