import { describe, expect, it } from 'vitest';
import { COMPONENT_CATEGORY_DEFS, resolveComponentCategory } from './ComponentsList';

const renderedCategories = new Set(COMPONENT_CATEGORY_DEFS.map((def) => def.key));

describe('ComponentsList category mapping', () => {
  it.each([
    ['basic/text', undefined, 'basic'],
    ['basic/digital-clock', 'basic', 'indicator'],
    ['interaction/basic-switch', 'interaction', 'controls'],
    ['interaction/basic-progress', 'interaction', 'indicator'],
    ['chart/echarts-line', 'chart', 'charts'],
    ['custom/alert-list', 'custom', 'indicator'],
    ['resources/model-3d', 'resources', 'mediaDecoration'],
    ['media/video-player', 'media', 'mediaDecoration'],
    ['decoration/tech-border', 'decoration', 'mediaDecoration'],
    ['geo/map', 'geo', 'industrial'],
    ['industrial/pump', 'industrial', 'industrial'],
    ['unknown/widget', undefined, 'basic'],
  ] as const)('maps %s category %s to visible group %s', (componentId, category, expected) => {
    const resolved = resolveComponentCategory({
      componentId,
      category,
      displayCategory: undefined,
    });

    expect(resolved).toBe(expected);
    expect(renderedCategories.has(resolved)).toBe(true);
  });

  it('prefers displayCategory from registry when present', () => {
    const resolved = resolveComponentCategory({
      componentId: 'custom/device-status-card',
      category: 'custom',
      displayCategory: 'indicator',
    });

    expect(resolved).toBe('indicator');
  });
});
