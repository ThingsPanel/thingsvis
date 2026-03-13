/**
 * extractFieldSchema: Derives a structured field schema from a runtime data snapshot.
 * Used by KernelStore to cache field structure independent of live data.
 *
 * Path conventions:
 *   "(root)"        — the value itself
 *   "key"           — top-level property
 *   "[].key"        — property of every element in a top-level array
 *   "arr[].key"     — property of every element in a nested array
 *   max depth = 4   — prevents runaway recursion on deep graphs
 */

export interface FieldSchemaEntry {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'unknown';
  /** A representative sample value (first occurrence). */
  example?: unknown;
}

function jsType(value: unknown): FieldSchemaEntry['type'] {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'unknown';
}

function visitObject(
  obj: Record<string, unknown>,
  prefix: string,
  depth: number,
  out: FieldSchemaEntry[]
): void {
  if (depth > 4) return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    out.push({ path, type: jsType(val), example: val });
    if (Array.isArray(val)) {
      visitArray(val, path, depth + 1, out);
    } else if (val !== null && typeof val === 'object') {
      visitObject(val as Record<string, unknown>, path, depth + 1, out);
    }
  }
}

function visitArray(
  arr: unknown[],
  prefix: string,
  depth: number,
  out: FieldSchemaEntry[]
): void {
  if (depth > 4) return;
  // Push the array path itself (already pushed by caller if nested)
  const arrPath = prefix ? `${prefix}[]` : '[]';
  // Avoid duplicate push when called from top-level
  if (!out.find(e => e.path === arrPath)) {
    out.push({ path: arrPath, type: 'array', example: arr[0] });
  }

  // Use first element as structural prototype
  const proto = arr[0];
  if (proto === null || proto === undefined) return;

  if (Array.isArray(proto)) {
    // Array of arrays
    visitArray(proto, arrPath, depth + 1, out);
  } else if (typeof proto === 'object') {
    // Array of objects — enumerate each key
    for (const key of Object.keys(proto as Record<string, unknown>)) {
      const val = (proto as Record<string, unknown>)[key];
      const childPath = `${arrPath}.${key}`;
      out.push({ path: childPath, type: jsType(val), example: val });
      if (Array.isArray(val)) {
        visitArray(val, childPath, depth + 1, out);
      } else if (val !== null && typeof val === 'object') {
        visitObject(val as Record<string, unknown>, childPath, depth + 1, out);
      }
    }
  }
  // Array of primitives — the arrPath entry is enough
}

/**
 * Extracts a flat list of field schema entries from a data snapshot.
 * Always includes "(root)" as the first entry.
 */
export function extractFieldSchema(data: unknown): FieldSchemaEntry[] {
  const out: FieldSchemaEntry[] = [];

  if (data === null || data === undefined) return out;

  out.push({ path: '(root)', type: jsType(data), example: data });

  if (Array.isArray(data)) {
    visitArray(data, '', 1, out);
  } else if (typeof data === 'object') {
    visitObject(data as Record<string, unknown>, '', 1, out);
  }
  // Primitives at root: only "(root)" is meaningful

  return out;
}
