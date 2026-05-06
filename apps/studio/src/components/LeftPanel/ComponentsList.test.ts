import { describe, expect, it } from 'vitest';
import { COMPONENT_CATEGORY_DEFS, resolveComponentCategory } from './ComponentsList';

const renderedCategories = new Set(COMPONENT_CATEGORY_DEFS.map((def) => def.key));

describe('ComponentsList category mapping', () => {
  it.each([
    ['basic/text', undefined, 'basic'],
    ['interaction/basic-switch', 'interaction', 'controls'],
    ['chart/echarts-line', 'chart', 'charts'],
    ['custom/alert-list', 'custom', 'business'],
    ['resources/model-3d', 'resources', 'media'],
    ['geo/map', 'geo', 'media'],
    ['industrial/pump', 'industrial', 'industrial'],
    ['unknown/widget', undefined, 'basic'],
  ] as const)('maps %s category %s to visible group %s', (componentId, category, expected) => {
    const resolved = resolveComponentCategory({ componentId, category });

    expect(resolved).toBe(expected);
    expect(renderedCategories.has(resolved)).toBe(true);
  });
});
