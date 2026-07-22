import { describe, expect, it } from 'vitest';
import {
  COMPONENT_CATEGORY_DEFS,
  COMPONENT_ORDER,
  resolveComponentCategory,
  sortComponentsByConfiguredOrder,
} from './ComponentsList';

const renderedCategories = new Set(COMPONENT_CATEGORY_DEFS.map((def) => def.key));

describe('ComponentsList category mapping', () => {
  it.each([
    ['basic/text', undefined, 'layout'],
    ['basic/digital-clock', 'basic', 'dataDisplay'],
    ['interaction/basic-switch', 'interaction', 'controls'],
    ['interaction/basic-progress', 'interaction', 'dataDisplay'],
    ['chart/echarts-line', 'chart', 'charts'],
    ['custom/alert-list', 'custom', 'dataDisplay'],
    ['resources/model-3d', 'resources', 'resources'],
    ['media/video-player', 'media', 'resources'],
    ['decoration/tech-border', 'decoration', 'resources'],
    ['geo/map', 'geo', 'industrial'],
    ['industrial/pump', 'industrial', 'industrial'],
    ['media/camera-control', 'media', 'industrial'],
    ['custom/guidance-steps', 'custom', 'controls'],
    ['unknown/widget', undefined, 'layout'],
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
      displayCategory: 'dataDisplay',
    });

    expect(resolved).toBe('dataDisplay');
  });

  it('uses the requested category order', () => {
    expect(COMPONENT_CATEGORY_DEFS.map((def) => def.key)).toEqual([
      'layout',
      'dataDisplay',
      'charts',
      'resources',
      'controls',
      'industrial',
    ]);
  });

  it('sorts components by the requested order', () => {
    const entries = ['basic/placeholder', 'basic/rectangle', 'basic/table'].map((componentId) => ({
      componentId,
    })) as never[];

    expect(sortComponentsByConfiguredOrder(entries).map((entry) => entry.componentId)).toEqual([
      'basic/rectangle',
      'basic/table',
      'basic/placeholder',
    ]);
    expect(COMPONENT_ORDER).toHaveLength(50);
  });
});
