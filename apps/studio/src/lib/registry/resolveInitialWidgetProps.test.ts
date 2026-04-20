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

  it('merges embedded preview defaults over schema defaults in embedded mode', () => {
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
      sampleData: {
        data: [{ name: 'Sample', value: 12 }],
      },
      previewDefaults: {
        title: 'Preview CPU',
      },
    });

    expect(result).toEqual({
      title: 'Preview CPU',
      data: [{ name: 'Sample', value: 12 }],
    });
  });

  it('does not apply embedded sample data in standalone mode', () => {
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
      data: z.array(z.any()).default([]),
    });

    const result = resolveInitialWidgetProps({
      schema,
      standaloneDefaults: {
        data: [{ name: 'Standalone', value: 18 }],
      },
      sampleData: {
        data: [{ name: 'Embedded', value: 12 }],
      },
    });

    expect(result).toEqual({
      data: [{ name: 'Standalone', value: 18 }],
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
