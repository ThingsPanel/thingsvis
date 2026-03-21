import type { NodeSchemaType } from '@thingsvis/schema';

export type ShapeStylePatch = Pick<NodeSchemaType, 'baseStyle' | 'props'>;

export function syncShapeStylePatch(
  componentType: string,
  patch: ShapeStylePatch,
  currentProps: Record<string, unknown>,
): ShapeStylePatch {
  if (!patch.baseStyle) return patch;

  const nextProps: Record<string, unknown> = {
    ...currentProps,
    ...(patch.props ?? {}),
  };

  if (componentType === 'basic/rectangle') {
    nextProps.stroke = 'transparent';
    nextProps.strokeWidth = 0;
    nextProps.cornerRadius =
      typeof patch.baseStyle?.border?.radius === 'number'
        ? patch.baseStyle.border.radius
        : ((nextProps.cornerRadius as number | undefined) ?? 0);

    return {
      ...patch,
      props: nextProps,
    };
  }

  if (componentType === 'basic/circle') {
    nextProps.stroke = 'transparent';
    nextProps.strokeWidth = 0;

    return {
      ...patch,
      props: nextProps,
    };
  }

  return patch;
}
