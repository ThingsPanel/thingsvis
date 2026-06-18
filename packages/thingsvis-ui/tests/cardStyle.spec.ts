import { describe, expect, it } from 'vitest';
import {
  applyCardStyleDefaults,
  removeCardStyleDefaults,
} from '../src/utils/cardStyle';

describe('card style helpers', () => {
  it('removes auto-applied card defaults when card mode is disabled', () => {
    const enabledStyle = applyCardStyleDefaults({
      card: { enabled: true },
    });

    expect(
      removeCardStyleDefaults({
        ...enabledStyle,
        card: { enabled: false },
      }),
    ).toEqual({
      card: { enabled: false },
    });
  });

  it('keeps customized base styles when card mode is disabled', () => {
    const enabledStyle = applyCardStyleDefaults({
      background: { color: '#111827', opacity: 1 },
      card: { enabled: true },
    });

    expect(
      removeCardStyleDefaults({
        ...enabledStyle,
        card: { enabled: false },
      }),
    ).toMatchObject({
      background: { color: '#111827', opacity: 1 },
      card: { enabled: false },
    });
  });
});
