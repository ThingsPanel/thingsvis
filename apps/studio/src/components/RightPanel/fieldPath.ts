export type FieldPathOptions = {
  maxDepth: number;
  maxNodes: number;
};

export type FieldPathListResult = {
  paths: string[];
  truncated: boolean;
};

const defaultOptions: FieldPathOptions = {
  maxDepth: 5,
  maxNodes: 200
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function listFieldPaths(value: unknown, options?: Partial<FieldPathOptions>): FieldPathListResult {
  const opts: FieldPathOptions = { ...defaultOptions, ...(options ?? {}) };
  const paths: string[] = [];
  let nodeCount = 0;
  let truncated = false;

  const pushPath = (path: string) => {
    if (!path) return;
    nodeCount += 1;
    if (nodeCount > opts.maxNodes) {
      truncated = true;
      return false;
    }
    paths.push(path);
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
        if (!pushPath(nextPrefix)) return;
        visit(current[i], nextPrefix, depth + 1);
      }
      return;
    }

    if (isPlainObject(current)) {
      const keys = Object.keys(current).sort();
      for (const key of keys) {
        if (truncated) return;
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (!pushPath(nextPrefix)) return;
        visit((current as Record<string, unknown>)[key], nextPrefix, depth + 1);
      }
    }
  };

  visit(value, '', 1);

  return { paths, truncated };
}
