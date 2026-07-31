import type { DataBinding } from '@thingsvis/schema';

export type BindingMode = 'static' | 'field' | 'expr';

export type FieldBindingSelection = {
  dataSourceId: string;
  fieldPath: string;
  transform?: string;
  historyConfig?: {
    timeRange: string;
    aggFunction?: 'AVG' | 'MIN' | 'MAX' | 'SUM' | 'COUNT' | 'NONE_RAW';
    aggWindow?: string;
  };
};

/** 可作为点分属性访问的安全标识符（不含点） */
const SAFE_PATH_SEGMENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function isSafePathSegment(segment: string): boolean {
  return SAFE_PATH_SEGMENT_RE.test(segment);
}

/**
 * 将字段路径编码为 `data` 之后的访问后缀（含前导 `.` 或 `[`）。
 * 一律按 `.` 分段：安全标识符用点分，仅不安全片段加括号。
 * 扁平含点键（如 A_3.Status_S）编码为 `data.A_3.Status_S`，由运行时最长匹配优先命中整键；
 * 嵌套路径（如 location.lat）同样点分，避免被误包成整键括号。
 */
export function encodeFieldPathAccess(fieldPath: string): string {
  const segments = fieldPath.replace(/\[\]/g, '.[]').split('.').filter(Boolean);
  let out = '';
  for (const seg of segments) {
    if (seg === '[]') {
      out += '[]';
      continue;
    }
    if (isSafePathSegment(seg)) {
      out = out ? `${out}.${seg}` : seg;
    } else {
      out += `[${JSON.stringify(seg)}]`;
    }
  }
  return out.startsWith('[') ? out : `.${out}`;
}

/**
 * 解析 `data` 之后的访问后缀，还原 fieldPath。
 * 支持旧点分形式与 `["..."]` / `['...']` 括号形式。
 */
export function decodeFieldPathAccess(suffix: string): string | null {
  const rest = suffix.trim();
  if (!rest) return '(root)';

  const segments: string[] = [];
  let i = 0;

  while (i < rest.length) {
    const ch = rest[i];

    if (ch === '.') {
      i += 1;
      if (i >= rest.length) return null;

      if (rest.startsWith('[]', i)) {
        segments.push('[]');
        i += 2;
        continue;
      }

      const ident = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(rest.slice(i));
      if (!ident) return null;
      let seg = ident[0];
      i += ident[0].length;
      if (rest.startsWith('[]', i)) {
        seg += '[]';
        i += 2;
      }
      segments.push(seg);
      continue;
    }

    if (ch === '[') {
      if (rest.startsWith('[]', i)) {
        segments.push('[]');
        i += 2;
        continue;
      }

      const doubleQuoted = /^\["((?:\\.|[^"\\])*)"\]/.exec(rest.slice(i));
      if (doubleQuoted) {
        try {
          segments.push(JSON.parse(`"${doubleQuoted[1]}"`) as string);
        } catch {
          return null;
        }
        i += doubleQuoted[0].length;
        continue;
      }

      const singleQuoted = /^\['((?:\\.|[^'\\])*)'\]/.exec(rest.slice(i));
      if (singleQuoted) {
        // 单引号内容按字面还原（make 使用 JSON.stringify 双引号；兼容手写单引号）
        segments.push(singleQuoted[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
        i += singleQuoted[0].length;
        continue;
      }

      return null;
    }

    return null;
  }

  if (segments.length === 0) return null;
  return segments.join('.');
}

export function isValidExpression(expression: string): boolean {
  return /^\{\{.*\}\}$/.test(expression.trim());
}

export function parseFieldBindingExpression(expression: string): FieldBindingSelection | null {
  const trimmed = expression.trim();

  // {{ ds.<id>.data }} / {{ ds.<id>.data.<path> }} / {{ ds.<id>.data["..."] }}
  const match = /^\{\{\s*ds\.([^.\s]+)\.data([\s\S]*?)\s*\}\}$/.exec(trimmed);
  if (!match) return null;

  const dataSourceId = match[1];
  if (!dataSourceId) return null;

  const suffix = match[2] ?? '';
  if (!suffix.trim()) {
    return { dataSourceId, fieldPath: '(root)' };
  }

  const fieldPath = decodeFieldPathAccess(suffix);
  if (fieldPath == null) return null;
  return { dataSourceId, fieldPath };
}

export function makeFieldBindingExpression(selection: FieldBindingSelection): string {
  // (root) 表示选择整个数据，不添加字段路径
  if (selection.fieldPath === '(root)' || !selection.fieldPath) {
    return `{{ ds.${selection.dataSourceId}.data }}`;
  }
  return `{{ ds.${selection.dataSourceId}.data${encodeFieldPathAccess(selection.fieldPath)} }}`;
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
