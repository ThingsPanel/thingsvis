import { describe, expect, it } from 'vitest';
import { resolveEditorStartupState } from './useEditorStartup';

describe('editor startup state', () => {
  it('does not report ready while widget bundles are still loading', () => {
    expect(
      resolveEditorStartupState({
        authResolved: true,
        isBootstrapping: false,
        projectLoaded: true,
        isRegistryReady: true,
        isWidgetsReady: false,
        hasPainted: false,
      }),
    ).toMatchObject({ phase: 'widgets', progress: 88 });
  });
});
