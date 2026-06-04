export type PlaybackDateRange = {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function compareDay(a: Date, b: Date): number {
  const dayA = startOfDay(a).getTime();
  const dayB = startOfDay(b).getTime();
  return dayA === dayB ? 0 : dayA < dayB ? -1 : 1;
}

function parseTimeValue(value: string, fallback: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function defaultPlaybackDateRange(): PlaybackDateRange {
  const endDate = startOfDay(new Date());
  const startDate = new Date(endDate);
  startDate.setHours(startDate.getHours() - 1);
  return {
    startDate: startOfDay(startDate),
    endDate,
    startTime: `${pad2(startDate.getHours())}:${pad2(startDate.getMinutes())}`,
    endTime: `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`,
  };
}

export function parsePlaybackRange(startIso: string, endIso: string): PlaybackDateRange {
  const defaults = defaultPlaybackDateRange();
  const start = startIso.trim() ? new Date(startIso) : new Date(defaults.startDate);
  const end = endIso.trim() ? new Date(endIso) : new Date(defaults.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return defaults;
  }
  const startDate = startOfDay(start);
  const endDate = startOfDay(end);
  return {
    startDate: compareDay(startDate, endDate) <= 0 ? startDate : endDate,
    endDate: compareDay(startDate, endDate) <= 0 ? endDate : startDate,
    startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    endTime: `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
  };
}

export function buildPlaybackIso(range: PlaybackDateRange): { start: string; end: string } | null {
  const [startHour = NaN, startMinute = NaN] = range.startTime.split(':').map(Number);
  const [endHour = NaN, endMinute = NaN] = range.endTime.split(':').map(Number);
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return null;
  }

  const start = new Date(range.startDate);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(range.endDate);
  end.setHours(endHour, endMinute, 59, 999);

  if (end.getTime() < start.getTime()) return null;
  return { start: start.toISOString(), end: end.toISOString() };
}

export type PlaybackCalendarLabels = {
  prevMonth: string;
  nextMonth: string;
  startTime: string;
  endTime: string;
  weekdays: string[];
};

export type PlaybackCalendarMount = {
  setRange: (range: PlaybackDateRange) => void;
  getRange: () => PlaybackDateRange;
  updateLabels: (labels: PlaybackCalendarLabels, locale?: string) => void;
  destroy: () => void;
};

type MountOptions = {
  locale?: string;
  labels: PlaybackCalendarLabels;
  onChange: (range: PlaybackDateRange) => void;
};

export function mountPlaybackCalendar(
  host: HTMLElement,
  options: MountOptions,
): PlaybackCalendarMount {
  let range = defaultPlaybackDateRange();
  let visibleMonth = new Date(range.endDate.getFullYear(), range.endDate.getMonth(), 1);
  let selectingEnd = false;

  host.className = 'tv-camera-playback-calendar';
  host.style.cssText = 'display:flex;flex-direction:column;gap:8px;min-width:0;';

  const header = document.createElement('div');
  header.className = 'tv-camera-calendar-header';
  header.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;gap:8px;';

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'tv-camera-calendar-nav';
  prevButton.textContent = '‹';

  const monthLabel = document.createElement('div');
  monthLabel.className = 'tv-camera-calendar-month';
  monthLabel.style.cssText =
    'flex:1 1 0;text-align:center;font-size:13px;font-weight:600;color:#fff;';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'tv-camera-calendar-nav';
  nextButton.textContent = '›';

  header.append(prevButton, monthLabel, nextButton);

  const weekdayRow = document.createElement('div');
  weekdayRow.className = 'tv-camera-calendar-weekdays';
  weekdayRow.style.cssText =
    'display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;';

  const grid = document.createElement('div');
  grid.className = 'tv-camera-calendar-grid';
  grid.style.cssText =
    'display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;';

  const timeRow = document.createElement('div');
  timeRow.className = 'tv-camera-calendar-times';
  timeRow.style.cssText =
    'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;';

  const startTimeInput = document.createElement('input');
  startTimeInput.type = 'time';
  startTimeInput.className = 'tv-camera-datetime-input';

  const endTimeInput = document.createElement('input');
  endTimeInput.type = 'time';
  endTimeInput.className = 'tv-camera-datetime-input';

  host.append(header, weekdayRow, grid, timeRow);

  const notify = () => options.onChange(range);

  const formatMonthTitle = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    if (options.locale?.startsWith('zh')) {
      return `${year}年${month}月`;
    }
    return new Intl.DateTimeFormat(options.locale || 'en', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const renderWeekdays = () => {
    weekdayRow.innerHTML = '';
    options.labels.weekdays.forEach((label) => {
      const cell = document.createElement('div');
      cell.textContent = label;
      cell.style.cssText =
        'text-align:center;font-size:10px;color:rgba(255,255,255,0.55);line-height:16px;';
      weekdayRow.appendChild(cell);
    });
  };

  const renderTimeFields = () => {
    timeRow.innerHTML = '';
    const addField = (label: string, input: HTMLInputElement) => {
      const field = document.createElement('label');
      field.style.cssText =
        'display:flex;flex-direction:column;gap:4px;font-size:11px;color:rgba(255,255,255,0.72);min-width:0;';
      const caption = document.createElement('span');
      caption.textContent = label;
      field.append(caption, input);
      timeRow.appendChild(field);
    };
    addField(options.labels.startTime, startTimeInput);
    addField(options.labels.endTime, endTimeInput);
    startTimeInput.value = range.startTime;
    endTimeInput.value = range.endTime;
  };

  const renderMonthGrid = () => {
    monthLabel.textContent = formatMonthTitle(visibleMonth);
    grid.innerHTML = '';

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = startOfDay(new Date());

    for (let i = 0; i < firstWeekday; i += 1) {
      const spacer = document.createElement('div');
      spacer.style.minHeight = '30px';
      grid.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tv-camera-calendar-day';
      button.textContent = String(day);

      const inRange =
        compareDay(date, range.startDate) >= 0 && compareDay(date, range.endDate) <= 0;
      const isStart = sameDay(date, range.startDate);
      const isEnd = sameDay(date, range.endDate);
      const isToday = sameDay(date, today);

      let background = 'transparent';
      let borderColor = 'transparent';
      let color = 'rgba(255,255,255,0.88)';

      if (inRange) {
        background = 'rgba(64, 158, 255, 0.22)';
        borderColor = 'rgba(64, 158, 255, 0.35)';
      }
      if (isStart || isEnd) {
        background = 'rgba(64, 158, 255, 0.55)';
        borderColor = 'rgba(64, 158, 255, 0.85)';
        color = '#fff';
      }
      if (isToday && !isStart && !isEnd) {
        borderColor = 'rgba(255,255,255,0.35)';
      }

      button.style.cssText = `
        min-height:30px;
        border:1px solid ${borderColor};
        border-radius:8px;
        background:${background};
        color:${color};
        font-size:12px;
        font-weight:600;
        cursor:pointer;
        padding:0;
      `;

      button.addEventListener('click', () => {
        const clicked = startOfDay(date);
        if (!selectingEnd || sameDay(range.startDate, range.endDate)) {
          range = {
            ...range,
            startDate: clicked,
            endDate: clicked,
          };
          selectingEnd = true;
        } else {
          if (compareDay(clicked, range.startDate) < 0) {
            range = { ...range, endDate: range.startDate, startDate: clicked };
          } else {
            range = { ...range, endDate: clicked };
          }
          selectingEnd = false;
        }
        visibleMonth = new Date(clicked.getFullYear(), clicked.getMonth(), 1);
        renderMonthGrid();
        notify();
      });

      grid.appendChild(button);
    }
  };

  const render = () => {
    prevButton.title = options.labels.prevMonth;
    nextButton.title = options.labels.nextMonth;
    renderWeekdays();
    renderTimeFields();
    renderMonthGrid();
  };

  prevButton.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderMonthGrid();
  });

  nextButton.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderMonthGrid();
  });

  startTimeInput.addEventListener('change', () => {
    range = {
      ...range,
      startTime: parseTimeValue(startTimeInput.value, range.startTime),
    };
    startTimeInput.value = range.startTime;
    notify();
  });

  endTimeInput.addEventListener('change', () => {
    range = {
      ...range,
      endTime: parseTimeValue(endTimeInput.value, range.endTime),
    };
    endTimeInput.value = range.endTime;
    notify();
  });

  render();

  return {
    setRange: (next) => {
      range = {
        startDate: startOfDay(next.startDate),
        endDate: startOfDay(next.endDate),
        startTime: parseTimeValue(next.startTime, range.startTime),
        endTime: parseTimeValue(next.endTime, range.endTime),
      };
      visibleMonth = new Date(range.endDate.getFullYear(), range.endDate.getMonth(), 1);
      selectingEnd = !sameDay(range.startDate, range.endDate);
      render();
    },
    updateLabels: (labels, locale) => {
      options.labels = labels;
      options.locale = locale;
      render();
    },
    getRange: () => ({
      startDate: startOfDay(range.startDate),
      endDate: startOfDay(range.endDate),
      startTime: range.startTime,
      endTime: range.endTime,
    }),
    destroy: () => {
      host.innerHTML = '';
    },
  };
}
