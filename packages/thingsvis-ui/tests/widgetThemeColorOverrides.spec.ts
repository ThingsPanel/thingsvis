import { describe, expect, it } from 'vitest';
import {
  createWidgetThemeColorOverrideStyle,
  resolveReadableWidgetTextColor,
} from '../src/utils/widgetThemeColorOverrides';

describe('widget theme color overrides', () => {
  it('uses dark widget foreground on explicit white surfaces', () => {
    expect(resolveReadableWidgetTextColor('#ffffff')).toBe('#0f172a');
  });

  it('uses light widget foreground on explicit dark surfaces', () => {
    expect(resolveReadableWidgetTextColor('#0a192f')).toBe('#f8fafc');
  });

  it('does not override transparent widget surfaces', () => {
    expect(createWidgetThemeColorOverrideStyle('transparent')).toEqual({});
  });

  it('adds fg, bg, axis, and border tokens for readable explicit surfaces', () => {
    expect(createWidgetThemeColorOverrideStyle('rgba(255, 255, 255, 0.96)')).toMatchObject({
      '--w-bg': 'rgba(255, 255, 255, 0.96)',
      '--w-fg': '#0f172a',
      '--w-axis': 'rgba(15, 23, 42, 0.14)',
      '--w-border': 'rgba(15, 23, 42, 0.12)',
    });
  });
});
