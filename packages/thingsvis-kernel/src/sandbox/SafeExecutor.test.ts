import { describe, expect, it } from 'vitest';

import { SafeExecutor } from './SafeExecutor';

describe('SafeExecutor transformation utils', () => {
  it('exposes utils in data source transformations', () => {
    expect(SafeExecutor.execute('utils.toFixed(data.value, 2)', { value: 3.14159 })).toBe('3.14');
  });

  it('exposes utils in field binding scripts', () => {
    expect(
      SafeExecutor.executeScript("return utils.map(value, { 0: 'offline', 1: 'online' })", {
        value: 1,
      }),
    ).toBe('online');
  });

  it('formats time with the default pattern', () => {
    expect(SafeExecutor.execute('utils.formatTime(data)', '2026-04-28T01:02:03.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
  });
});
