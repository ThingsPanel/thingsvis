const PLAYBACK_SPEEDS = [1, 1.5, 2, 4] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
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
  selectRange?: string;
  loading?: string;
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
  onSelectRange?: () => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
};

const chromeIconSvg = {
  play:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.75v12.5c0 .78.86 1.26 1.53.85l9.5-6.25a1 1 0 0 0 0-1.7l-9.5-6.25A1 1 0 0 0 8 5.75z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13M16 5.5v13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5A1.5 1.5 0 0 1 5.5 8h3.1l4.15-3.45A1.35 1.35 0 0 1 15 5.6v12.8a1.35 1.35 0 0 1-2.25 1.05L8.6 16H5.5A1.5 1.5 0 0 1 4 14.5v-5zm13.2-.95a1 1 0 0 1 1.4.18 5.47 5.47 0 0 1 0 6.54 1 1 0 1 1-1.58-1.22 3.47 3.47 0 0 0 0-4.1 1 1 0 0 1 .18-1.4z"/></svg>',
  muted:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5A1.5 1.5 0 0 1 5.5 8h3.1l4.15-3.45A1.35 1.35 0 0 1 15 5.6v12.8a1.35 1.35 0 0 1-2.25 1.05L8.6 16H5.5A1.5 1.5 0 0 1 4 14.5v-5zm13.3.1a1 1 0 0 1 1.4 0L20 10.9l1.3-1.3a1 1 0 1 1 1.4 1.4l-1.3 1.3 1.3 1.3a1 1 0 0 1-1.4 1.4L20 13.7 18.7 15a1 1 0 1 1-1.4-1.4l1.3-1.3-1.3-1.3a1 1 0 0 1 0-1.4z"/></svg>',
} as const;

function setChromeIconButton(
  button: HTMLButtonElement,
  icon: keyof typeof chromeIconSvg,
  title: string,
) {
  button.innerHTML = chromeIconSvg[icon];
  button.title = title;
}

export function mountPlaybackChrome(shell: HTMLElement, options: MountOptions): PlaybackChromeMount {
  let labels = options.labels;
  let speedIndex = 0;
  let active = false;

  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'tv-camera-playback-loading';
  loadingOverlay.style.cssText = `
    position:absolute;inset:0;z-index:4;display:none;
    align-items:center;justify-content:center;
    color:rgba(255,255,255,0.86);font-size:13px;font-weight:600;
    background:rgba(3,7,18,0.35);pointer-events:none;
  `;
  shell.appendChild(loadingOverlay);

  const root = document.createElement('div');
  root.className = 'tv-camera-playback-chrome';
  root.style.cssText = `
    position:absolute;left:0;right:0;bottom:0;z-index:5;display:none;
    pointer-events:auto;box-sizing:border-box;
  `;

  const controlBar = document.createElement('div');
  controlBar.className = 'tv-camera-chrome-controls';
  controlBar.style.cssText = `
    display:flex;align-items:center;gap:10px;padding:8px 10px;flex-wrap:nowrap;
    border-radius:0;background:rgba(5,10,18,0.78);border:0;
  `;

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'tv-camera-chrome-icon-btn';
  setChromeIconButton(playButton, 'pause', labels.pause);

  const volumeWrap = document.createElement('div');
  volumeWrap.style.cssText = 'display:flex;align-items:center;gap:6px;min-width:58px;max-width:72px;flex:0 0 72px;';
  const muteButton = document.createElement('button');
  muteButton.type = 'button';
  muteButton.className = 'tv-camera-chrome-icon-btn';
  setChromeIconButton(muteButton, 'volume', labels.mute);
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
  root.append(controlBar);
  shell.appendChild(root);

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
  fsButton.addEventListener('click', options.onFullscreen);

  return {
    setActive: (nextActive) => {
      active = nextActive;
      root.style.display = nextActive ? 'block' : 'none';
      if (!nextActive) {
        loadingOverlay.style.display = 'none';
      }
    },
    updateLabels: (next) => {
      labels = next;
      qualitySelect.options[0]!.text = labels.quality;
      qualitySelect.options[0]!.textContent = labels.quality;
    },
    updateState: (state) => {
      loadingOverlay.textContent = labels.loading ?? 'Connecting playback video';
      loadingOverlay.style.display = active && !state.ready ? 'flex' : 'none';
      setChromeIconButton(playButton, state.paused ? 'play' : 'pause', state.paused ? labels.play : labels.pause);
      playButton.disabled = !state.ready;
      setChromeIconButton(muteButton, state.muted ? 'muted' : 'volume', state.muted ? labels.unmute : labels.mute);
      muteButton.disabled = !state.ready;
      volumeRange.value = String(Math.round(state.volume * 100));
      volumeRange.disabled = !state.ready;

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
      speedSelect.disabled = !state.ready;
      fsButton.disabled = !state.ready;
    },
    getSpeedIndex: () => speedIndex,
    setSpeedIndex: (index) => {
      speedIndex = index;
      speedSelect.value = String(index);
    },
    destroy: () => {
      loadingOverlay.remove();
      root.remove();
    },
  };
}

export { PLAYBACK_SPEEDS };
