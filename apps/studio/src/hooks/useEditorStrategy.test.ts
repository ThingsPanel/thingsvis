import { describe, expect, it } from 'vitest';
import { shouldUseWidgetMode } from './editorStrategyMode';

describe('shouldUseWidgetMode', () => {
  it('keeps dashboard host embeds on the autosave editor path', () => {
    expect(
      shouldUseWidgetMode({
        embedded: true,
        saveTarget: 'host',
        context: 'dashboard',
      }),
    ).toBe(false);
  });

  it('uses widget mode for non-dashboard host-owned embeds', () => {
    expect(
      shouldUseWidgetMode({
        embedded: true,
        saveTarget: 'host',
        context: 'device-template',
      }),
    ).toBe(true);
  });

  it('does not use widget mode for self-managed embeds', () => {
    expect(
      shouldUseWidgetMode({
        embedded: true,
        saveTarget: 'self',
        context: 'dashboard',
      }),
    ).toBe(false);
  });
});
