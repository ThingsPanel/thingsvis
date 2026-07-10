import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Editor data source navigation wiring', () => {
  it('passes the save-free navigation handler directly to EditorTopNav', () => {
    const source = readFileSync(
      join(process.cwd(), 'apps/studio/src/components/Editor.tsx'),
      'utf8',
    );
    const handlerStart = source.indexOf('const openDataSources = useCallback(() => {');
    const handlerEnd = source.indexOf('}, [embedVisibility.isEmbedded, projectId]);', handlerStart);
    const handler = source.slice(handlerStart, handlerEnd);

    expect(handlerStart).toBeGreaterThanOrEqual(0);
    expect(handlerEnd).toBeGreaterThan(handlerStart);
    expect(handler).toContain('navigateToDataSources({');
    expect(handler).not.toContain('saveNow');
    expect(handler).not.toContain('sendToHost');
    expect(source).toContain('onOpenDataSources={openDataSources}');
  });
});
