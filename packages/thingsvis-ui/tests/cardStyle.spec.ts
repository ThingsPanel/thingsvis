import { describe, expect, it } from 'vitest';
import {
  AUTO_CARD_STYLE,
  applyCardStyleDefaults,
  isAutoCardStyle,
  resolveCardTitle,
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

  it('resolves auto cards through theme tokens without persisting a color', () => {
    const style = { card: { enabled: true, appearance: 'auto' as const } };
    expect(isAutoCardStyle(style)).toBe(true);
    expect(AUTO_CARD_STYLE.background).toContain('--w-bg');
    expect(AUTO_CARD_STYLE.borderColor).toContain('--w-border');
    expect(resolveCardTitle(style.card, 'Temperature')).toBe('');
  });

  it('preserves explicit titles and manual historical title fallback', () => {
    expect(resolveCardTitle({ enabled: true, appearance: 'auto', title: '温度' }, 'Temperature')).toBe('温度');
    expect(resolveCardTitle({ enabled: true }, 'Temperature')).toBe('Temperature');
  });

  it('does not treat disabled auto cards as automatic', () => {
    expect(isAutoCardStyle({ card: { enabled: false, appearance: 'auto' } })).toBe(false);
  });
});
