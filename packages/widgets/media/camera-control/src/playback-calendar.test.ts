import { describe, expect, it } from 'vitest';
import {
  buildPlaybackIso,
  defaultPlaybackDateRange,
  parsePlaybackRange,
} from './playback-calendar';

describe('playback-calendar helpers', () => {
  it('parses ISO strings into local date and time parts', () => {
    const range = parsePlaybackRange('2026-06-04T08:15:00.000Z', '2026-06-04T09:30:00.000Z');
    expect(range.startTime).toMatch(/^\d{2}:\d{2}$/);
    expect(range.endTime).toMatch(/^\d{2}:\d{2}$/);
    expect(range.startDate.getFullYear()).toBe(2026);
    expect(range.endDate.getMonth()).toBe(5);
    expect(range.endDate.getDate()).toBe(4);
  });

  it('builds ISO timestamps from selected calendar day and time inputs', () => {
    const defaults = defaultPlaybackDateRange();
    const range = {
      ...defaults,
      startDate: new Date(2026, 5, 4),
      endDate: new Date(2026, 5, 4),
      startTime: '08:00',
      endTime: '09:00',
    };
    const iso = buildPlaybackIso(range);
    expect(iso).not.toBeNull();
    expect(iso?.start).toContain('2026-06-04');
    expect(iso?.end).toContain('2026-06-04');
    expect(new Date(iso!.end).getTime()).toBeGreaterThan(new Date(iso!.start).getTime());
  });
});
