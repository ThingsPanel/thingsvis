import { describe, expect, it, vi } from 'vitest';
import { executeAction } from '../src/engine/executeActions';

describe('executeAction callWrite', () => {
  it('resolves dataSourceId and payload expressions before writing', () => {
    const writeDataSource = vi.fn(async () => ({ success: true }));

    executeAction(
      {
        type: 'callWrite',
        dataSourceId: '{{vars.targetDataSourceId}}',
        payload: '{"value": "{{payload}}"}',
      },
      {
        variableValues: { targetDataSourceId: 'platform-device-1' },
        dataSources: {},
      },
      true,
      { dataSourceManager: { writeDataSource } as any },
    );

    expect(writeDataSource).toHaveBeenCalledWith('platform-device-1', { value: 'true' });
  });
});
