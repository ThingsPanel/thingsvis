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

  // 如果根级别是数组或对象，添加 "(root)" 选项让用户可以选择整个数据
  if (Array.isArray(value) || isPlainObject(value)) {
    paths.push('(root)');
    pathInfos.push({ path: '(root)', type: getValueType(value) });
    nodeCount += 1;
  }

  const pushPath = (path: string, pathValue: unknown) => {
    if (!path) return;
    nodeCount += 1;
    if (nodeCount > opts.maxNodes) {
      truncated = true;
      return false;
    }
    paths.push(path);
    pathInfos.push({ path, type: getValueType(pathValue) });
    return true;
  };

  const visit = (current: unknown, prefix: string, depth: number) => {
    if (truncated) return;
    if (depth > opts.maxDepth) return;

    if (Array.isArray(current)) {
      // MVP: include indexed segments.
      for (let i = 0; i < current.length; i += 1) {
        if (truncated) return;
        const nextPrefix = prefix ? `${prefix}.${i}` : String(i);
        if (!pushPath(nextPrefix, current[i])) return;
        visit(current[i], nextPrefix, depth + 1);
      }
      return;
    }

    if (isPlainObject(current)) {
      const keys = Object.keys(current).sort();
      for (const key of keys) {
        if (truncated) return;
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        const childValue = (current as Record<string, unknown>)[key];
        if (!pushPath(nextPrefix, childValue)) return;
        visit(childValue, nextPrefix, depth + 1);
      }
    }
  };

  visit(value, '', 1);

  return { paths, pathInfos, truncated };
}
