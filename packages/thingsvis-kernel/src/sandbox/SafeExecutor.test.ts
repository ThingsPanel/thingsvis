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

  it('does not treat identifiers containing return as return statements', () => {
    const result = SafeExecutor.executeScript(
      `[
        {
          name: '供水压力',
          data: (data.supplyPressure__history ?? []).map((e) => ({ value: e.value, time: e.ts })),
        },
        {
          name: '回水压力',
          data: (data.returnPressure__history ?? []).map((e) => ({ value: e.value, time: e.ts })),
        },
      ]`,
      {
        data: {
          supplyPressure__history: [{ ts: 1, value: 0.38 }],
          returnPressure__history: [{ ts: 1, value: 0.32 }],
        },
      },
    );

    expect(result).toEqual([
      { name: '供水压力', data: [{ value: 0.38, time: 1 }] },
      { name: '回水压力', data: [{ value: 0.32, time: 1 }] },
    ]);
  });
});
