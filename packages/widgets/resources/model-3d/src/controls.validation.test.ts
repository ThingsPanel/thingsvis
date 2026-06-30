import { describe, expect, it } from 'vitest';
import { WidgetControlsSchema } from '@thingsvis/schema';
import { controls } from './controls';
import Main from './index';
import { PropsSchema } from './schema';

describe('model-3d controls', () => {
  it('exports valid widget controls from controls.ts', () => {
    const parsed = WidgetControlsSchema.safeParse(controls);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(details);
    }

    expect(parsed.data.groups.length).toBeGreaterThan(0);
    expect(parsed.data.groups.some((group) => group.fields.some((field) => field.path === 'modelUrl'))).toBe(
      true,
    );
    expect(parsed.data.groups.some((group) => group.fields.some((field) => field.path === 'requestMode'))).toBe(
      false,
    );
  });

  it('discards the removed request mode from old persisted props', () => {
    expect(PropsSchema.parse({ requestMode: 'direct' })).not.toHaveProperty('requestMode');
  });

  it('keeps controls on Main export', () => {
    expect(Main.controls).toBeDefined();
    const parsed = WidgetControlsSchema.safeParse(Main.controls);
    expect(parsed.success).toBe(true);
  });
});
