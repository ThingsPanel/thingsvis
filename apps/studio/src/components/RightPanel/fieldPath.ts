export type FieldPathOptions = {
  maxDepth: number;
  maxNodes: number;
};

/**
 * 字段路径信息，包含路径和类型
 */
export type FieldPathInfo = {
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'unknown';
};

export type FieldPathListResult = {
  paths: string[];
  pathInfos: FieldPathInfo[];
  truncated: boolean;
};

const defaultOptions: FieldPathOptions = {
  maxDepth: 5,
  maxNodes: 200
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getValueType(value: unknown): FieldPathInfo['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

export function listFieldPaths(value: unknown, options?: Partial<FieldPathOptions>): FieldPathListResult {
  const opts: FieldPathOptions = { ...defaultOptions, ...(options ?? {}) };
  const paths: string[] = [];
  const pathInfos: FieldPathInfo[] = [];
  let nodeCount = 0;
  let truncated = false;

  // Root entry: always add "(root)" for array/object so user can bind the whole structure
  if (Array.isArray(value) || isPlainObject(value)) {
    paths.push('(root)');
    pathInfos.push({ path: '(root)', type: getValueType(value) });
    nodeCount += 1;
  }

  const pushPath = (path: string, pathValue: unknown): boolean => {
    if (!path) return true;
    nodeCount += 1;
    if (nodeCount > opts.maxNodes) {
      truncated = true;
      return false;
    }
    paths.push(path);
    pathInfos.push({ path, type: getValueType(pathValue) });
    return true;
  };

  /**
   * visitArray: instead of iterating by index (old behaviour that produced "0.value", "1.value"...),
   * take arr[0] as a structural prototype and emit `prefix[]` + `prefix[].key` paths.
   * This keeps the list O(keys) not O(rows × keys).
   */
  const visitArray = (arr: unknown[], prefix: string, depth: number) => {
    if (truncated) return;
    // The array path itself (e.g. "items[]" or "[]" at root)
    const arrPath = prefix ? `${prefix}[]` : '[]';
    if (!pushPath(arrPath, arr)) return;

    if (depth >= opts.maxDepth) return;

    const proto = arr[0];
    if (proto === undefined || proto === null) return;

    if (Array.isArray(proto)) {
      // Array of arrays
      visitArray(proto, arrPath, depth + 1);
    } else if (isPlainObject(proto)) {
      // Array of objects — enumerate prototype keys
      const keys = Object.keys(proto as Record<string, unknown>).sort();
      for (const key of keys) {
        if (truncated) return;
        const val = (proto as Record<string, unknown>)[key];
        const childPath = `${arrPath}.${key}`;
        if (!pushPath(childPath, val)) return;
        if (Array.isArray(val)) {
          visitArray(val, childPath, depth + 1);
        } else if (isPlainObject(val)) {
          visitObject(val, childPath, depth + 1);
        }
      }
    }
    // Array of primitives — arrPath is sufficient
  };

  const visitObject = (obj: Record<string, unknown>, prefix: string, depth: number) => {
    if (truncated) return;
    if (depth > opts.maxDepth) return;
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (truncated) return;
      const childPath = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (!pushPath(childPath, val)) return;
      if (Array.isArray(val)) {
        visitArray(val, childPath, depth + 1);
      } else if (isPlainObject(val)) {
        visitObject(val, childPath, depth + 1);
      }
    }
  };

  if (Array.isArray(value)) {
    visitArray(value, '', 1);
  } else if (isPlainObject(value)) {
    visitObject(value as Record<string, unknown>, '', 1);
  }

  return { paths, pathInfos, truncated };
}

/**
 * resolveFieldPath: extract a value from data using a field path produced by listFieldPaths.
 *
 * Supported path formats:
 *   "(root)"        → data itself
 *   "key"           → data.key
 *   "[].key"        → data is array → data[0].key  (component maps over full array as needed)
 *   "items[].name"  → data.items[0].name (first element representative)
 *   "a.b.c"         → data.a.b.c
 *
 * Returns undefined if the path cannot be resolved (caller should handle gracefully).
 */
export function resolveFieldPath(data: unknown, path: string): unknown {
  if (path === '(root)') return data;
  if (data === null || data === undefined) return undefined;

  // Split path into segments, handling [] notation
  // e.g. "[].value" → ["[]", "value"]
  // e.g. "items[].name" → ["items", "[]", "name"]
  const segments = path
    .replace(/\[\]/g, '.[]')
    .split('.')
    .filter(Boolean);

  let current: unknown = data;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (seg === '[]') {
      // Descend into first array element as representative
      if (Array.isArray(current)) {
        current = current[0];
      } else {
        return undefined;
      }
    } else if (Array.isArray(current)) {
      // Implicit array lookup — take first element
      current = (current[0] as Record<string, unknown>)?.[seg];
    } else if (isPlainObject(current)) {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}
