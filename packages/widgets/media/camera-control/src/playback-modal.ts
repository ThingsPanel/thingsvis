import {
  buildPlaybackIso,
  mountPlaybackCalendar,
  type PlaybackCalendarLabels,
  type PlaybackCalendarMount,
  type PlaybackDateRange,
  parsePlaybackRange,
} from './playback-calendar';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function timeToMinutes(value: string): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 0;
  return Math.min(1439, Math.max(0, Number(match[1]) * 60 + Number(match[2])));
}

function minutesToTime(minutes: number): string {
  const clamped = Math.min(1439, Math.max(0, minutes));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

function formatDateTime(date: Date, time: string, locale?: string): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  if (locale?.startsWith('zh')) {
    return `${y}-${m}-${d} ${time}`;
  }
  return `${y}-${m}-${d} ${time}`;
}

export type PlaybackModalLabels = {
  title: string;
  subtitle: string;
  close: string;
  preview: string;
  dateSelect: string;
  timeRange: string;
  selectionPrefix: string;
  cancel: string;
  startPlayback: string;
};

export type PlaybackModalMount = {
  setRangeFromProps: (startIso: string, endIso: string) => void;
  updateLabels: (labels: PlaybackModalLabels, calendarLabels: PlaybackCalendarLabels, locale?: string) => void;
  setOpen: (open: boolean) => void;
  getRange: () => PlaybackDateRange;
  destroy: () => void;
};

type MountOptions = {
  locale?: string;
  labels: PlaybackModalLabels;
  calendarLabels: PlaybackCalendarLabels;
  previewElement: HTMLElement;
  onChange?: (range: PlaybackDateRange) => void;
  onStart: () => void;
  onCancel: () => void;
};

export function mountPlaybackModal(shell: HTMLElement, options: MountOptions): PlaybackModalMount {
  let calendar: PlaybackCalendarMount;
  let startMinutes = 0;
  let endMinutes = 1439;
  let activeThumb: 'start' | 'end' = 'start';

  const overlay = document.createElement('div');
  overlay.className = 'tv-camera-playback-modal';
  overlay.style.cssText = `
    position:absolute;
    inset:0;
    z-index:6;
    display:none;
    align-items:stretch;
    justify-content:stretch;
    padding:12px;
    box-sizing:border-box;
    background:rgba(1,4,10,0.9);
    backdrop-filter:blur(2px);
    pointer-events:auto;
  `;

  const card = document.createElement('div');
  card.className = 'tv-camera-playback-modal-card';
  card.style.cssText = `
    display:flex;
    flex-direction:column;
    flex:1 1 0;
    min-height:0;
    border-radius:12px;
    border:1px solid rgba(255,255,255,0.14);
    background:
      radial-gradient(circle at 26% 18%, rgba(255,255,255,0.09), transparent 32%),
      linear-gradient(180deg, rgba(24,30,42,0.99) 0%, rgba(11,15,23,0.99) 100%);
    box-shadow:0 24px 80px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.06);
    overflow:hidden;
  `;

  const header = document.createElement('div');
  header.className = 'tv-camera-playback-modal-header';
  header.style.cssText =
    'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 24px 14px;';

  const headerText = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.className = 'tv-camera-playback-modal-title';
  titleEl.style.cssText = 'font-size:20px;font-weight:750;color:#fff;line-height:1.3;';
  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'tv-camera-playback-modal-subtitle';
  subtitleEl.style.cssText =
    'margin-top:6px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.66);line-height:1.45;';
  headerText.append(titleEl, subtitleEl);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'tv-camera-playback-modal-close';
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    width:40px;height:40px;border:1px solid rgba(255,255,255,0.14);border-radius:9px;
    background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9);font-size:28px;line-height:1;cursor:pointer;padding:0;
  `;
  header.append(headerText, closeButton);

  const body = document.createElement('div');
  body.className = 'tv-camera-playback-modal-body';
  body.style.cssText =
    'display:flex;gap:28px;flex:1 1 0;min-height:0;padding:0 24px 18px;';

  const previewColumn = document.createElement('div');
  previewColumn.style.cssText =
    'flex:1.35 1 0;min-width:0;display:flex;flex-direction:column;gap:12px;';

  const previewLabel = document.createElement('div');
  previewLabel.style.cssText = 'font-size:15px;font-weight:700;color:rgba(255,255,255,0.9);';

  const previewHost = document.createElement('div');
  previewHost.className = 'tv-camera-playback-preview';
  previewHost.style.cssText = `
    position:relative;flex:1 1 0;min-height:120px;border-radius:10px;overflow:hidden;
    background:
      radial-gradient(circle at 50% 48%, rgba(255,255,255,0.05), transparent 34%),
      #010309;
    border:1px solid rgba(255,255,255,0.12);
    box-shadow:inset 0 0 0 1px rgba(0,0,0,0.45), inset 0 -40px 80px rgba(0,0,0,0.44);
  `;

  const previewPlaceholder = document.createElement('div');
  previewPlaceholder.className = 'tv-camera-playback-preview-placeholder';
  previewPlaceholder.style.cssText = `
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    pointer-events:none;
  `;
  const previewPlayCircle = document.createElement('div');
  previewPlayCircle.className = 'tv-camera-playback-preview-play';
  previewPlayCircle.textContent = '▶';
  previewPlaceholder.appendChild(previewPlayCircle);
  previewHost.appendChild(previewPlaceholder);

  previewColumn.append(previewLabel, previewHost);

  const calendarColumn = document.createElement('div');
  calendarColumn.style.cssText =
    'flex:0.9 1 0;min-width:300px;min-height:0;display:flex;flex-direction:column;gap:10px;overflow:hidden;';

  const calendarLabel = document.createElement('div');
  calendarLabel.style.cssText = 'font-size:15px;font-weight:700;color:rgba(255,255,255,0.9);';

  const calendarHost = document.createElement('div');
  calendarHost.style.cssText = 'flex:1 1 0;min-height:0;overflow:hidden;';

  calendarColumn.append(calendarLabel, calendarHost);

  body.append(previewColumn, calendarColumn);

  const timeSection = document.createElement('div');
  timeSection.className = 'tv-camera-playback-time-section';
  timeSection.style.cssText = 'padding:2px 24px 12px;display:flex;flex-direction:column;gap:10px;';

  const timeTitle = document.createElement('div');
  timeTitle.style.cssText = 'font-size:15px;font-weight:700;color:rgba(255,255,255,0.9);';

  const timeTrackWrap = document.createElement('div');
  timeTrackWrap.style.cssText = 'position:relative;height:68px;padding:8px 10px 0;';

  const timeLabels = document.createElement('div');
  timeLabels.style.cssText =
    'display:flex;justify-content:space-between;font-size:13px;font-weight:600;color:rgba(255,255,255,0.78);margin:0 -10px 8px;';

  const timeTrack = document.createElement('div');
  timeTrack.className = 'tv-camera-playback-time-track';
  timeTrack.style.cssText =
    'position:relative;height:10px;border-radius:999px;background:rgba(255,255,255,0.18);box-shadow:inset 0 1px 2px rgba(0,0,0,0.36);';

  const timeFill = document.createElement('div');
  timeFill.style.cssText = `
    position:absolute;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
    box-shadow:0 0 18px rgba(47,125,255,0.38);
  `;

  const startThumb = document.createElement('input');
  startThumb.type = 'range';
  startThumb.className = 'tv-camera-playback-time-thumb tv-camera-playback-time-thumb-start';
  startThumb.min = '0';
  startThumb.max = '1439';
  startThumb.value = '0';

  const endThumb = document.createElement('input');
  endThumb.type = 'range';
  endThumb.className = 'tv-camera-playback-time-thumb tv-camera-playback-time-thumb-end';
  endThumb.min = '0';
  endThumb.max = '1439';
  endThumb.value = '1439';

  const timeScale = document.createElement('div');
  timeScale.className = 'tv-camera-playback-time-scale';
  timeScale.style.cssText =
    'display:flex;justify-content:space-between;margin:10px -10px 0;font-size:12px;font-weight:500;color:rgba(255,255,255,0.58);';

  timeTrack.append(timeFill, startThumb, endThumb);
  timeLabels.innerHTML = '<span>00:00</span><span>23:59</span>';
  for (let hour = 2; hour <= 22; hour += 2) {
    const tick = document.createElement('span');
    tick.textContent = `${pad2(hour)}:00`;
    timeScale.appendChild(tick);
  }
  timeTrackWrap.append(timeLabels, timeTrack, timeScale);
  timeSection.append(timeTitle, timeTrackWrap);

  const footer = document.createElement('div');
  footer.className = 'tv-camera-playback-modal-footer';
  footer.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:14px 24px 16px;border-top:1px solid rgba(255,255,255,0.1);
  `;

  const selectionSummary = document.createElement('div');
  selectionSummary.className = 'tv-camera-playback-selection';
  selectionSummary.style.cssText =
    'font-size:14px;font-weight:600;color:rgba(255,255,255,0.74);line-height:1.4;flex:1 1 0;min-width:0;';

  const footerActions = document.createElement('div');
  footerActions.style.cssText = 'display:flex;gap:8px;flex-shrink:0;';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'tv-camera-playback-btn tv-camera-playback-btn-secondary';

  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'tv-camera-playback-btn tv-camera-playback-btn-primary';

  footerActions.append(cancelButton, startButton);
  footer.append(selectionSummary, footerActions);

  card.append(header, body, timeSection, footer);
  overlay.appendChild(card);
  shell.appendChild(overlay);

  const notify = () => {
    const range = calendar.getRange();
    options.onChange?.(range);
    updateSummary();
    updateTimeVisuals();
  };

  const syncTimeFromRange = (range: PlaybackDateRange) => {
    startMinutes = timeToMinutes(range.startTime);
    endMinutes = timeToMinutes(range.endTime);
    if (endMinutes < startMinutes) endMinutes = startMinutes;
    startThumb.value = String(startMinutes);
    endThumb.value = String(endMinutes);
    updateTimeVisuals();
  };

  const pushTimeToCalendar = () => {
    const range = calendar.getRange();
    calendar.setRange({
      ...range,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
    });
    notify();
  };

  const updateTimeVisuals = () => {
    const width = timeTrack.clientWidth || 1;
    const left = (startMinutes / 1439) * width;
    const right = (endMinutes / 1439) * width;
    timeFill.style.left = `${left}px`;
    timeFill.style.width = `${Math.max(0, right - left)}px`;
  };

  const updateSummary = () => {
    const range = calendar.getRange();
    const endDisplayTime = minutesToTime(endMinutes);
    const endDate =
      endMinutes < startMinutes && compareDays(range.startDate, range.endDate) === 0
        ? new Date(range.endDate.getTime() + 86400000)
        : range.endDate;
    selectionSummary.textContent = `${options.labels.selectionPrefix} ${formatDateTime(
      range.startDate,
      minutesToTime(startMinutes),
      options.locale,
    )} - ${formatDateTime(endDate, endDisplayTime, options.locale)}`;
  };

  function compareDays(a: Date, b: Date): number {
    const dayA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const dayB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return dayA === dayB ? 0 : dayA < dayB ? -1 : 1;
  }

  const applyLabels = () => {
    titleEl.textContent = options.labels.title;
    subtitleEl.textContent = options.labels.subtitle;
    closeButton.title = options.labels.close;
    previewLabel.textContent = options.labels.preview;
    calendarLabel.textContent = options.labels.dateSelect;
    timeTitle.textContent = options.labels.timeRange;
    cancelButton.textContent = options.labels.cancel;
    startButton.textContent = options.labels.startPlayback;
  };

  calendar = mountPlaybackCalendar(calendarHost, {
    locale: options.locale,
    labels: options.calendarLabels,
    showTimeInputs: false,
    onChange: (range) => {
      syncTimeFromRange(range);
      notify();
    },
  });

  applyLabels();

  const syncPreview = (open: boolean) => {
    previewPlaceholder.style.display = 'flex';
    options.previewElement.style.visibility = open ? 'hidden' : 'visible';
  };

  startThumb.addEventListener('input', () => {
    activeThumb = 'start';
    startMinutes = Number(startThumb.value);
    if (startMinutes > endMinutes) {
      endMinutes = startMinutes;
      endThumb.value = String(endMinutes);
    }
    pushTimeToCalendar();
  });

  endThumb.addEventListener('input', () => {
    activeThumb = 'end';
    endMinutes = Number(endThumb.value);
    if (endMinutes < startMinutes) {
      startMinutes = endMinutes;
      startThumb.value = String(startMinutes);
    }
    pushTimeToCalendar();
  });

  closeButton.addEventListener('click', options.onCancel);
  cancelButton.addEventListener('click', options.onCancel);
  startButton.addEventListener('click', options.onStart);

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateTimeVisuals());
    resizeObserver.observe(timeTrack);
  }

  return {
    setRangeFromProps: (startIso, endIso) => {
      const range = parsePlaybackRange(startIso, endIso);
      calendar.setRange(range);
      syncTimeFromRange(range);
      updateSummary();
    },
    updateLabels: (labels, calendarLabels, locale) => {
      options.labels = labels;
      options.calendarLabels = calendarLabels;
      options.locale = locale;
      calendar.updateLabels(calendarLabels, locale);
      applyLabels();
      updateSummary();
    },
    setOpen: (open) => {
      overlay.style.display = open ? 'flex' : 'none';
      syncPreview(open);
      if (open) {
        requestAnimationFrame(updateTimeVisuals);
      }
    },
    getRange: () => calendar.getRange(),
    destroy: () => {
      resizeObserver?.disconnect();
      syncPreview(false);
      calendar.destroy();
      overlay.remove();
    },
  };
}

export { buildPlaybackIso };
