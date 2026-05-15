import { describe, expect, it } from 'vitest';
import { UpdateProjectSchema } from './project';

describe('UpdateProjectSchema', () => {
  it('accepts updating only the project name', () => {
    const result = UpdateProjectSchema.safeParse({
      name: 'Renamed project',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual({
      name: 'Renamed project',
    });
  });

  it('accepts null description and normalizes it to undefined', () => {
    const result = UpdateProjectSchema.safeParse({
      name: 'Renamed project',
      description: null,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual({
      name: 'Renamed project',
      description: undefined,
    });
  });
});
