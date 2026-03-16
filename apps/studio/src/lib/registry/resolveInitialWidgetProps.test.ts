import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('../embedded/service-config', () => ({
  resolveEditorServiceConfig: vi.fn(),
}));

import { resolveEditorServiceConfig } from '../embedded/service-config';
import { resolveInitialWidgetProps } from './resolveInitialWidgetProps';

const mockedResolveEditorServiceConfig = vi.mocked(resolveEditorServiceConfig);

describe('resolveInitialWidgetProps', () => {
  it('merges standalone defaults over schema defaults in standalone mode', () => {
    mockedResolveEditorServiceConfig.mockReturnValue({
      mode: 'standalone',
      integrationLevel: 'full',
      ui: {
        showComponentLibrary: true,
        showPropsPanel: true,
        showTopLeft: true,
        showToolbar: true,
        showTopRight: true,
      },
      warnings: [],
    });

    const schema = z.object({
      title: z.string().default('CPU'),
      data: z.array(z.any()).default([]),
    });

    const result = resolveInitialWidgetProps({
      schema,
      standaloneDefaults: {
        data: [{ name: 'Mon', value: 18 }],
      },
    });

    expect(result).toEqual({
      title: 'CPU',
      data: [{ name: 'Mon', value: 18 }],
    });
  });

  it('returns only schema defaults in embedded mode', () => {
    mockedResolveEditorServiceConfig.mockReturnValue({
      mode: 'embedded',
      integrationLevel: 'full',
      ui: {
        showComponentLibrary: true,
        showPropsPanel: true,
        showTopLeft: true,
        showToolbar: true,
        showTopRight: true,
      },
      warnings: [],
    });

    const schema = z.object({
      title: z.string().default('CPU'),
      data: z.array(z.any()).default([]),
    });

    const result = resolveInitialWidgetProps({
      schema,
      standaloneDefaults: {
        data: [{ name: 'Mon', value: 18 }],
      },
    });

    expect(result).toEqual({
      title: 'CPU',
      data: [],
    });
  });

  it('falls back safely when only fallback defaults are available', () => {
    mockedResolveEditorServiceConfig.mockReturnValue({
      mode: 'standalone',
      integrationLevel: 'full',
      ui: {
        showComponentLibrary: true,
        showPropsPanel: true,
        showTopLeft: true,
        showToolbar: true,
        showTopRight: true,
      },
      warnings: [],
    });

    const result = resolveInitialWidgetProps({
      fallbackDefaults: { value: 42 },
    });

    expect(result).toEqual({ value: 42 });
  });
});
