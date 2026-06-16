import { describe, expect, it, vi } from 'vitest';
import {
  buildPlaybackIso,
  defaultPlaybackDateRange,
  mountPlaybackCalendar,
  parsePlaybackRange,
  type PlaybackCalendarLabels,
} from './playback-calendar';

const calendarLabels: PlaybackCalendarLabels = {
  prevMonth: 'Prev',
  nextMonth: 'Next',
  startTime: 'Start',
  endTime: 'End',
  weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};

function clickDay(host: HTMLElement, day: number) {
  const button = Array.from(host.querySelectorAll('.tv-camera-calendar-day')).find(
    (item) => item.textContent === String(day),
  ) as HTMLButtonElement | undefined;
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

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

  it('builds ISO timestamps across multiple calendar days', () => {
    const iso = buildPlaybackIso({
      startDate: new Date(2026, 5, 15),
      endDate: new Date(2026, 5, 16),
      startTime: '00:00',
      endTime: '00:00',
    });
    expect(iso).not.toBeNull();
    expect(new Date(iso!.start).getDate()).toBe(15);
    expect(new Date(iso!.end).getDate()).toBe(16);
    expect(new Date(iso!.end).getTime()).toBeGreaterThan(new Date(iso!.start).getTime());
  });
});

describe('mountPlaybackCalendar', () => {
  it('extends a collapsed same-day selection into a multi-day range', () => {
    const host = document.createElement('div');
    const onChange = vi.fn();
    const calendar = mountPlaybackCalendar(host, {
      labels: calendarLabels,
      onChange,
    });

    calendar.setRange({
      startDate: new Date(2026, 5, 15),
      endDate: new Date(2026, 5, 15),
      startTime: '00:00',
      endTime: '00:00',
    });

    clickDay(host, 16);

    const range = calendar.getRange();
    expect(range.startDate.getDate()).toBe(15);
    expect(range.endDate.getDate()).toBe(16);
    expect(onChange).toHaveBeenCalled();

    calendar.destroy();
  });

  it('starts a new single-day selection after a completed range', () => {
    const host = document.createElement('div');
    const calendar = mountPlaybackCalendar(host, {
      labels: calendarLabels,
      onChange: () => {},
    });

    calendar.setRange({
      startDate: new Date(2026, 5, 15),
      endDate: new Date(2026, 5, 16),
      startTime: '00:00',
      endTime: '00:00',
    });

    clickDay(host, 18);

    const range = calendar.getRange();
    expect(range.startDate.getDate()).toBe(18);
    expect(range.endDate.getDate()).toBe(18);

    calendar.destroy();
  });
});
