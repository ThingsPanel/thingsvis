const PLAYBACK_SPEEDS = [1, 1.5, 2, 4] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatClockTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function formatProgressTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
}

export type PlaybackChromeLabels = {
  modePlayback: string;
  online: string;
  offline: string;
  recording: string;
  idleRecord: string;
  snapshot: string;
  fullscreen: string;
  exitFullscreen: string;
  returnToLive: string;
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  quality: string;
  qualityValue: string;
  speed: string;
  statOnline: string;
  statQuality: string;
  statNetwork: string;
  statTime: string;
  networkGood: string;
};

export type PlaybackChromeState = {
  deviceTitle: string;
  online?: boolean;
  recording?: boolean;
  paused: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  speedIndex: number;
  ready: boolean;
  scrubbing?: boolean;
};

export type PlaybackChromeMount = {
  setActive: (active: boolean) => void;
  updateLabels: (labels: PlaybackChromeLabels) => void;
  updateState: (state: PlaybackChromeState) => void;
  getSpeedIndex: () => number;
  setSpeedIndex: (index: number) => void;
  destroy: () => void;
};

type MountOptions = {
  videoElement: HTMLElement;
  placeholderElement: HTMLElement;
  labels: PlaybackChromeLabels;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSeek: (ratio: number) => void;
  onSpeedChange: (index: number) => void;
  onSnapshot: () => void;
  onFullscreen: () => void;
  onReturnToLive: () => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
};

function makeIconAction(label: string, icon: string, className: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.title = label;
  button.innerHTML = `<span class="tv-camera-chrome-action-icon">${icon}</span><span>${label}</span>`;
  return button;
}

export function mountPlaybackChrome(shell: HTMLElement, options: MountOptions): PlaybackChromeMount {
  let labels = options.labels;
  let speedIndex = 0;
  let clockTimer: ReturnType<typeof setInterval> | null = null;

  const root = document.createElement('div');
  root.className = 'tv-camera-playback-chrome';
  root.style.cssText = `
    position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:8px;
    padding:10px;box-sizing:border-box;background:#0b101a;pointer-events:auto;
  `;

  const topBar = document.createElement('div');
  topBar.className = 'tv-camera-chrome-top';
  topBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';

  const statusGroup = document.createElement('div');
  statusGroup.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';

  const chipPlayback = document.createElement('span');
  chipPlayback.className = 'tv-camera-chrome-chip tv-camera-chrome-chip-mode';

  const chipOnline = document.createElement('span');
  chipOnline.className = 'tv-camera-chrome-chip tv-camera-chrome-chip-online';

  const chipRecording = document.createElement('span');
  chipRecording.className = 'tv-camera-chrome-chip tv-camera-chrome-chip-recording';

  statusGroup.append(chipPlayback, chipOnline, chipRecording);

  const actionGroup = document.createElement('div');
  actionGroup.className = 'tv-camera-chrome-actions';
  actionGroup.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const snapshotButton = makeIconAction('', '📷', 'tv-camera-chrome-action');
  const fullscreenButton = makeIconAction('', '⛶', 'tv-camera-chrome-action');
  const returnButton = makeIconAction('', '↩', 'tv-camera-chrome-action');
  actionGroup.append(snapshotButton, fullscreenButton, returnButton);

  topBar.append(statusGroup, actionGroup);

  const videoFrame = document.createElement('div');
  videoFrame.className = 'tv-camera-chrome-video-frame';
  videoFrame.style.cssText = `
    position:relative;flex:1 1 0;min-height:0;border-radius:12px;overflow:hidden;
    background:#05070d;border:1px solid rgba(255,255,255,0.08);
  `;

  const deviceBadge = document.createElement('div');
  deviceBadge.className = 'tv-camera-chrome-device-badge';
  deviceBadge.style.cssText = `
    position:absolute;top:10px;left:10px;z-index:2;display:flex;align-items:center;gap:6px;
    padding:5px 10px;border-radius:8px;background:rgba(0,0,0,0.55);color:#fff;font-size:12px;
    pointer-events:none;max-width:calc(100% - 20px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  `;
  const deviceIcon = document.createElement('span');
  deviceIcon.textContent = '📹';
  const deviceTitle = document.createElement('span');
  deviceBadge.append(deviceIcon, deviceTitle);
  videoFrame.appendChild(deviceBadge);

  const controlBar = document.createElement('div');
  controlBar.className = 'tv-camera-chrome-controls';
  controlBar.style.cssText =
    'display:flex;align-items:center;gap:10px;padding:4px 2px;flex-wrap:nowrap;';

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'tv-camera-chrome-icon-btn';
  playButton.textContent = '⏸';

  const volumeWrap = document.createElement('div');
  volumeWrap.style.cssText = 'display:flex;align-items:center;gap:6px;min-width:88px;';
  const muteButton = document.createElement('button');
  muteButton.type = 'button';
  muteButton.className = 'tv-camera-chrome-icon-btn';
  muteButton.textContent = '🔊';
  const volumeRange = document.createElement('input');
  volumeRange.type = 'range';
  volumeRange.className = 'tv-camera-chrome-volume';
  volumeRange.min = '0';
  volumeRange.max = '100';
  volumeRange.value = '80';
  volumeWrap.append(muteButton, volumeRange);

  const progressWrap = document.createElement('div');
  progressWrap.style.cssText = 'flex:1 1 0;min-width:0;display:flex;align-items:center;gap:8px;';
  const progressRange = document.createElement('input');
  progressRange.type = 'range';
  progressRange.className = 'tv-camera-chrome-progress';
  progressRange.min = '0';
  progressRange.max = '1000';
  progressRange.value = '0';
  const progressTime = document.createElement('span');
  progressTime.className = 'tv-camera-chrome-progress-time';
  progressTime.style.cssText =
    'flex:0 0 auto;font-size:11px;color:rgba(255,255,255,0.85);font-variant-numeric:tabular-nums;white-space:nowrap;';
  progressWrap.append(progressRange, progressTime);

  const qualitySelect = document.createElement('select');
  qualitySelect.className = 'tv-camera-chrome-select';
  qualitySelect.innerHTML = '<option value="hd">HD</option>';

  const speedSelect = document.createElement('select');
  speedSelect.className = 'tv-camera-chrome-select';
  PLAYBACK_SPEEDS.forEach((speed, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${speed}x`;
    speedSelect.appendChild(option);
  });

  const fsButton = document.createElement('button');
  fsButton.type = 'button';
  fsButton.className = 'tv-camera-chrome-icon-btn';
  fsButton.textContent = '⛶';

  controlBar.append(playButton, volumeWrap, progressWrap, qualitySelect, speedSelect, fsButton);

  const statsPanel = document.createElement('div');
  statsPanel.className = 'tv-camera-chrome-stats';
  statsPanel.style.cssText =
    'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.03);';

  const statCells: Array<{ icon: HTMLElement; label: HTMLElement; value: HTMLElement }> = [];
  for (let i = 0; i < 4; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'tv-camera-chrome-stat-cell';
    cell.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 12px;min-width:0;' +
      (i < 3 ? 'border-right:1px solid rgba(255,255,255,0.08);' : '');
    const icon = document.createElement('span');
    icon.style.cssText = 'font-size:16px;line-height:1;flex-shrink:0;';
    const meta = document.createElement('div');
    meta.style.cssText = 'min-width:0;display:flex;flex-direction:column;gap:2px;';
    const label = document.createElement('div');
    label.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.45);';
    const value = document.createElement('div');
    value.style.cssText = 'font-size:12px;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    meta.append(label, value);
    cell.append(icon, meta);
    statsPanel.appendChild(cell);
    statCells.push({ icon, label, value });
  }

  root.append(topBar, videoFrame, controlBar, statsPanel);
  shell.appendChild(root);

  const applyActionLabels = () => {
    snapshotButton.querySelector('span:last-child')!.textContent = labels.snapshot;
    fullscreenButton.querySelector('span:last-child')!.textContent = labels.fullscreen;
    returnButton.querySelector('span:last-child')!.textContent = labels.returnToLive;
    snapshotButton.title = labels.snapshot;
    fullscreenButton.title = labels.fullscreen;
    returnButton.title = labels.returnToLive;
    chipPlayback.textContent = labels.modePlayback;
    qualitySelect.options[0]!.text = labels.quality;
    qualitySelect.options[0]!.textContent = labels.quality;
    statCells[0]!.icon.textContent = '●';
    statCells[1]!.icon.textContent = 'HD';
    statCells[2]!.icon.textContent = '📶';
    statCells[3]!.icon.textContent = '🕐';
    statCells[0]!.label.textContent = labels.statOnline;
    statCells[1]!.label.textContent = labels.statQuality;
    statCells[2]!.label.textContent = labels.statNetwork;
    statCells[3]!.label.textContent = labels.statTime;
  };

  applyActionLabels();

  const resetVideoLayout = () => {
    const video = options.videoElement;
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.right = '0';
    video.style.bottom = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.zIndex = '1';
    video.style.borderRadius = '';
  };

  const syncVideoToFrame = () => {
    const video = options.videoElement;
    const shellRect = shell.getBoundingClientRect();
    const frameRect = videoFrame.getBoundingClientRect();
    if (shellRect.width <= 0 || frameRect.width <= 0) {
      resetVideoLayout();
      return;
    }
    const top = frameRect.top - shellRect.top;
    const left = frameRect.left - shellRect.left;
    video.style.position = 'absolute';
    video.style.top = `${top}px`;
    video.style.left = `${left}px`;
    video.style.width = `${frameRect.width}px`;
    video.style.height = `${frameRect.height}px`;
    video.style.right = 'auto';
    video.style.bottom = 'auto';
    video.style.zIndex = '1';
    video.style.borderRadius = '12px';
  };

  let frameObserver: ResizeObserver | null = null;

  const startFrameObserver = () => {
    stopFrameObserver();
    if (typeof ResizeObserver === 'undefined') return;
    frameObserver = new ResizeObserver(() => syncVideoToFrame());
    frameObserver.observe(root);
    frameObserver.observe(videoFrame);
  };

  const stopFrameObserver = () => {
    frameObserver?.disconnect();
    frameObserver = null;
  };

  playButton.addEventListener('click', options.onPlayPause);
  muteButton.addEventListener('click', options.onMuteToggle);
  volumeRange.addEventListener('input', () => {
    options.onVolumeChange(Number(volumeRange.value));
  });
  progressRange.addEventListener('pointerdown', () => options.onScrubStart?.());
  progressRange.addEventListener('pointerup', () => options.onScrubEnd?.());
  progressRange.addEventListener('pointercancel', () => options.onScrubEnd?.());
  progressRange.addEventListener('input', () => {
    options.onSeek(Number(progressRange.value) / 1000);
  });
  speedSelect.addEventListener('change', () => {
    speedIndex = Number(speedSelect.value);
    options.onSpeedChange(speedIndex);
  });
  snapshotButton.addEventListener('click', options.onSnapshot);
  fullscreenButton.addEventListener('click', options.onFullscreen);
  fsButton.addEventListener('click', options.onFullscreen);
  returnButton.addEventListener('click', options.onReturnToLive);

  const startClock = () => {
    stopClock();
    const tick = () => {
      statCells[3]!.value.textContent = formatClockTime(new Date());
    };
    tick();
    clockTimer = setInterval(tick, 1000);
  };

  const stopClock = () => {
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };

  return {
    setActive: (active) => {
      root.style.display = active ? 'flex' : 'none';
      if (active) {
        requestAnimationFrame(() => {
          syncVideoToFrame();
          startFrameObserver();
        });
        startClock();
      } else {
        stopFrameObserver();
        resetVideoLayout();
        stopClock();
      }
    },
    updateLabels: (next) => {
      labels = next;
      applyActionLabels();
    },
    updateState: (state) => {
      deviceTitle.textContent = state.deviceTitle || 'Camera';
      chipOnline.textContent = state.online ? labels.online : labels.offline;
      chipOnline.classList.toggle('is-online', state.online === true);
      chipOnline.classList.toggle('is-offline', state.online === false);
      const recordingOn = state.recording === true;
      chipRecording.innerHTML = recordingOn
        ? `<span class="tv-camera-chrome-rec-dot"></span>${labels.recording}`
        : labels.idleRecord;
      chipRecording.classList.toggle('is-recording', recordingOn);

      playButton.textContent = state.paused ? '▶' : '⏸';
      playButton.title = state.paused ? labels.play : labels.pause;
      muteButton.textContent = state.muted ? '🔇' : '🔊';
      muteButton.title = state.muted ? labels.unmute : labels.mute;
      volumeRange.value = String(Math.round(state.volume * 100));

      const hasDuration = state.ready && Number.isFinite(state.duration) && state.duration > 0;
      progressRange.disabled = !hasDuration;
      if (hasDuration) {
        if (!state.scrubbing) {
          progressRange.value = String(Math.round((state.currentTime / state.duration) * 1000));
        }
        progressTime.textContent = `${formatProgressTime(state.currentTime)} / ${formatProgressTime(state.duration)}`;
      } else {
        progressTime.textContent = formatProgressTime(state.currentTime);
      }

      speedSelect.value = String(state.speedIndex);
      statCells[0]!.value.textContent = state.online ? labels.online : labels.offline;
      statCells[1]!.value.textContent = labels.qualityValue;
      statCells[2]!.value.textContent = labels.networkGood;
    },
    getSpeedIndex: () => speedIndex,
    setSpeedIndex: (index) => {
      speedIndex = index;
      speedSelect.value = String(index);
    },
    destroy: () => {
      stopClock();
      stopFrameObserver();
      resetVideoLayout();
      root.remove();
    },
  };
}

export { PLAYBACK_SPEEDS };
