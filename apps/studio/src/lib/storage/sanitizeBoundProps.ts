type NodeLike = {
  props?: Record<string, unknown>;
  data?: Array<{ targetProp?: unknown }>;
  [key: string]: unknown;
};

function getBoundTargetProps(node: NodeLike): Set<string> {
  const bindings = Array.isArray(node.data) ? node.data : [];
  return new Set(
    bindings
      .map((binding) => binding.targetProp)
      .filter(
        (targetProp): targetProp is string =>
          typeof targetProp === 'string' && targetProp.length > 0,
      ),
  );
}

export function stripStaticPropsForBoundFields<T extends NodeLike>(nodes: T[]): T[] {
  return nodes.map((node) => {
    const props = node.props;
    if (!props || typeof props !== 'object') return node;

    const boundTargetProps = getBoundTargetProps(node);
    if (boundTargetProps.size === 0) return node;

    let changed = false;
    const nextProps = { ...props };

    boundTargetProps.forEach((targetProp) => {
      if (Object.prototype.hasOwnProperty.call(nextProps, targetProp)) {
        delete nextProps[targetProp];
        changed = true;
      }
    });

    return changed ? ({ ...node, props: nextProps } as T) : node;
  });
}

export function stripStaticPropsForBoundProject<T extends { nodes: NodeLike[] }>(project: T): T {
  return {
    ...project,
    nodes: stripStaticPropsForBoundFields(project.nodes),
  };
}
