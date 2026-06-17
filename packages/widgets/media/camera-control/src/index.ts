import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLocaleRecord,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import './lib/video-rtc.js';
import { mountPlaybackModal, buildPlaybackIso } from './playback-modal';
import { mountPlaybackChrome, PLAYBACK_SPEEDS } from './playback-chrome';

import zh from './locales/zh.json';
import en from './locales/en.json';

type RuntimeState = 'empty' | 'idle' | 'loading' | 'error' | 'ready';
type Direction = 'up' | 'down' | 'left' | 'right';

type RuntimeMessages = {
  runtime: Record<
    | Exclude<RuntimeState, 'ready'>
    | 'live'
    | 'playback'
    | 'online'
    | 'offline'
  | 'recording'
  | 'idleRecord',
    string
  >;
  buttons: Record<string, string>;
  calendar: {
    prevMonth: string;
    nextMonth: string;
    startTime: string;
    endTime: string;
    hint: string;
    weekdays: string[];
  };
  playbackModal: {
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
  playbackChrome: {
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
};

const localeCatalog = { en, zh } as const;
const LIVE_CHROME_HEIGHT = 52;
const PLAYBACK_CHROME_HEIGHT = 44;

function getMessages(locale: string | undefined): RuntimeMessages {
  return resolveLocaleRecord(localeCatalog, locale, 'zh') as RuntimeMessages;
}

function resolveDeviceTitle(locale: string | undefined, title: string): string {
  const trimmed = title.trim();
  if (trimmed) return trimmed;
  return locale?.startsWith('zh') ? '摄像头设备' : 'Camera';
}

function resolveObjectPosition(objectFit: string): string {
  return objectFit === 'fill' ? 'center center' : 'center top';
}

function normalizeSource(input: unknown): string {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return '';
  try {
    return new URL(trimmed, window.location.href).href;
  } catch {
    return trimmed;
  }
}

function normalizeCommand(command: string): string {
  return command.trim();
}

function commandPayload(command: string, params: Record<string, unknown>) {
  return normalizeCommand(command) ? params : null;
}

function toUnixSeconds(value: Date | string): number {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Math.floor(time / 1000);
}

function createPlaybackParams(startTime: number, endTime: number): Record<string, unknown> {
  return {
    type: 'cloud2',
    channel_no: 1,
    start_time: startTime,
    end_time: endTime,
  };
}

function createRecentPlaybackParams(now = Date.now()): Record<string, unknown> {
  const endTime = Math.floor(now / 1000);
  return createPlaybackParams(endTime - 24 * 60 * 60, endTime);
}

function createRangePlaybackParams(range: { start: string; end: string }): Record<string, unknown> {
  return createPlaybackParams(toUnixSeconds(range.start), toUnixSeconds(range.end));
}

function statusToBool(value: string): boolean | undefined {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  if (['1', 'true', 'online', 'on', 'yes'].includes(normalized)) return true;
  if (['0', 'false', 'offline', 'off', 'no'].includes(normalized)) return false;
  return undefined;
}

type StreamMode = 'live' | 'playback';

function makeButton(label: string, title: string, className: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.title = title;
  return button;
}

const iconSvg = {
  play:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.75v12.5c0 .78.86 1.26 1.53.85l9.5-6.25a1 1 0 0 0 0-1.7l-9.5-6.25A1 1 0 0 0 8 5.75z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13M16 5.5v13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5A1.5 1.5 0 0 1 5.5 8h3.1l4.15-3.45A1.35 1.35 0 0 1 15 5.6v12.8a1.35 1.35 0 0 1-2.25 1.05L8.6 16H5.5A1.5 1.5 0 0 1 4 14.5v-5zm13.2-.95a1 1 0 0 1 1.4.18 5.47 5.47 0 0 1 0 6.54 1 1 0 1 1-1.58-1.22 3.47 3.47 0 0 0 0-4.1 1 1 0 0 1 .18-1.4z"/></svg>',
  muted:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5A1.5 1.5 0 0 1 5.5 8h3.1l4.15-3.45A1.35 1.35 0 0 1 15 5.6v12.8a1.35 1.35 0 0 1-2.25 1.05L8.6 16H5.5A1.5 1.5 0 0 1 4 14.5v-5zm13.3.1a1 1 0 0 1 1.4 0L20 10.9l1.3-1.3a1 1 0 1 1 1.4 1.4l-1.3 1.3 1.3 1.3a1 1 0 0 1-1.4 1.4L20 13.7 18.7 15a1 1 0 1 1-1.4-1.4l1.3-1.3-1.3-1.3a1 1 0 0 1 0-1.4z"/></svg>',
} as const;

function setIconButton(button: HTMLButtonElement, icon: keyof typeof iconSvg, title: string) {
  button.innerHTML = iconSvg[icon];
  button.title = title;
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentCtx = ctx;
    let currentLocale = ctx.locale;
    let currentMode = ctx.mode ?? 'edit';
    let currentSrc = '';
    let state: RuntimeState = 'empty';
    let internalVideo: HTMLVideoElement | null = null;
    let readyPoll: ReturnType<typeof setInterval> | null = null;
    let attachVideoRaf = 0;
    let activeDirection: Direction | null = null;
    let colors = resolveWidgetColors(element);
    let runtimeStreamMode: StreamMode = props.mode === 'playback' ? 'playback' : 'live';
    let playbackPanelOpen = false;
    let playbackSpeedIndex = 0;
    let transportTimer: ReturnType<typeof setInterval> | null = null;
    let scrubbingTransport = false;

    element.dataset.thingsvisOverlay = 'media-camera-control';
    element.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
      font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
      background:
        radial-gradient(circle at 28% 18%, rgba(43, 78, 125, 0.2), transparent 34%),
        linear-gradient(135deg, #0b111b 0%, #090d14 48%, #070a10 100%);
      color: #f8fafc;
      padding: 8px 14px 10px;
    `;

    const styleEl = document.createElement('style');
    element.appendChild(styleEl);

    const topBar = document.createElement('div');
    topBar.className = 'tv-camera-topbar';
    topBar.style.cssText = `
      flex:0 0 auto;
      display:flex;
      flex-direction:row;
      align-items:center;
      flex-wrap:nowrap;
      gap:8px;
      width:100%;
      min-height:36px;
      margin-bottom:8px;
      box-sizing:border-box;
      overflow-x:auto;
      overflow-y:hidden;
      scrollbar-width:none;
    `;
    element.appendChild(topBar);

    const statusBar = document.createElement('div');
    statusBar.className = 'tv-camera-status-bar';
    statusBar.style.cssText = `
      display:flex;
      align-items:center;
      flex-wrap:nowrap;
      flex:0 0 auto;
      gap:10px;
      min-width:0;
      pointer-events:none;
    `;
    topBar.appendChild(statusBar);

    const topBarSpacer = document.createElement('div');
    topBarSpacer.className = 'tv-camera-topbar-spacer';
    topBarSpacer.style.cssText = 'flex:1 1 auto;min-width:4px;height:1px;';
    topBar.appendChild(topBarSpacer);

    const actionPanel = document.createElement('div');
    actionPanel.className = 'tv-camera-action-panel';
    actionPanel.style.cssText =
      'display:none;flex-wrap:nowrap;justify-content:flex-end;align-items:center;gap:4px;flex:0 0 auto;min-width:0;';
    topBar.appendChild(actionPanel);

    const shell = document.createElement('div');
    shell.className = 'tv-camera-shell';
    shell.style.cssText =
      'position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:transparent;box-sizing:border-box;';
    element.appendChild(shell);

    const liveHeader = document.createElement('div');
    liveHeader.className = 'tv-camera-live-header';
    liveHeader.style.cssText = `
      position:absolute;
      top:8px;
      left:8px;
      z-index:3;
      display:none;
      align-items:center;
      gap:8px;
      max-width:calc(100% - 16px);
      padding:6px 10px;
      box-sizing:border-box;
      border-radius:8px;
      color:rgba(255,255,255,0.96);
      font-size:13px;
      font-weight:600;
      line-height:1;
      pointer-events:none;
      background:rgba(7,10,16,0.62);
      backdrop-filter:blur(4px);
    `;
    shell.appendChild(liveHeader);

    const liveHeaderIcon = document.createElement('span');
    liveHeaderIcon.className = 'tv-camera-live-header-icon';
    liveHeaderIcon.textContent = '▣';
    liveHeader.appendChild(liveHeaderIcon);

    const liveTitleLabel = document.createElement('span');
    liveTitleLabel.className = 'tv-camera-live-title';
    liveHeader.appendChild(liveTitleLabel);

    const videoStage = document.createElement('div');
    videoStage.className = 'tv-camera-video-stage';
    videoStage.style.cssText = `
      position:absolute;
      left:0;
      right:0;
      top:0;
      bottom:0;
      overflow:hidden;
      border-radius:8px;
      background:#030712;
    `;
    shell.appendChild(videoStage);

    const videoEl: any = document.createElement('video-rtc');
    videoEl.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden;z-index:1;';
    videoStage.appendChild(videoEl);

    const placeholder = document.createElement('div');
    placeholder.className = 'tv-camera-live-placeholder';
    placeholder.style.cssText = `
      position:absolute;
      inset:0;
      z-index:2;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:16px;
      box-sizing:border-box;
      color:rgba(255,255,255,0.72);
      background:
        radial-gradient(circle at 50% 42%, rgba(255,255,255,0.08), transparent 30%),
        rgba(3,6,13,0.82);
      text-align:center;
    `;
    const placeholderText = document.createElement('div');
    placeholderText.className = 'tv-camera-live-placeholder-text';
    placeholder.appendChild(placeholderText);
    videoStage.appendChild(placeholder);

    const liveChrome = document.createElement('div');
    liveChrome.className = 'tv-camera-live-chrome';
    liveChrome.style.cssText = `
      position:absolute;
      left:0;
      right:0;
      bottom:0;
      z-index:3;
      display:none;
      align-items:center;
      gap:12px;
      height:52px;
      padding:0 14px;
      box-sizing:border-box;
      color:#fff;
      background:linear-gradient(180deg, rgba(21,27,38,0.72), rgba(15,20,30,0.92));
      border:0;
      border-radius:0;
      box-shadow:0 -16px 32px rgba(0,0,0,0.26);
    `;
    shell.appendChild(liveChrome);

    const livePlayButton = makeButton('', 'Pause', 'tv-camera-live-chrome-icon');
    liveChrome.appendChild(livePlayButton);

    const liveVolumeButton = makeButton('', 'Mute', 'tv-camera-live-chrome-icon');
    liveChrome.appendChild(liveVolumeButton);

    const liveVolumeTrack = document.createElement('input');
    liveVolumeTrack.type = 'range';
    liveVolumeTrack.className = 'tv-camera-live-volume-track';
    liveVolumeTrack.min = '0';
    liveVolumeTrack.max = '100';
    liveVolumeTrack.value = '80';
    liveChrome.appendChild(liveVolumeTrack);

    const liveFullscreenButton = makeButton('⛶', 'Fullscreen', 'tv-camera-live-chrome-icon');
    liveChrome.appendChild(liveFullscreenButton);

    const ptzPanel = document.createElement('div');
    ptzPanel.className = 'tv-camera-ptz-panel';
    ptzPanel.style.cssText = `
      position:absolute;
      left:10px;
      bottom:10px;
      z-index:4;
      display:none;
      grid-template-columns:36px 36px 36px;
      grid-template-rows:36px 36px 36px;
      gap:4px;
    `;
    shell.appendChild(ptzPanel);

    const stopTransportTimer = () => {
      if (transportTimer) {
        clearInterval(transportTimer);
        transportTimer = null;
      }
    };

    const stopReadyPoll = () => {
      if (readyPoll) {
        clearInterval(readyPoll);
        readyPoll = null;
      }
    };

    const updatePlaceholder = (next: RuntimeState) => {
      state = next;
      if (next === 'ready') {
        placeholder.style.display = 'none';
        renderControls();
        return;
      }
      const messages = getMessages(currentLocale).runtime;
      placeholder.style.display = 'flex';
      placeholderText.textContent = messages[next] || messages.empty;
      renderControls();
    };

    videoEl.addEventListener('video-rtc-ready', () => {
      updatePlaceholder('ready');
      stopReadyPoll();
    });

    const markReadyIfPlayable = () => {
      if (!currentSrc || !internalVideo) return;
      if (internalVideo.readyState >= 2 || !internalVideo.paused || internalVideo.currentTime > 0) {
        updatePlaceholder('ready');
      }
    };

    const startReadyPoll = () => {
      stopReadyPoll();
      readyPoll = setInterval(() => {
        if (state === 'ready') {
          stopReadyPoll();
          return;
        }
        if (internalVideo && (internalVideo.readyState >= 2 || internalVideo.currentTime > 0)) {
          updatePlaceholder('ready');
          stopReadyPoll();
          return;
        }
        if ((videoEl as HTMLVideoElement).videoWidth > 0) {
          updatePlaceholder('ready');
          stopReadyPoll();
        }
      }, 300);
    };

    const getCalendarLabels = () => {
      const messages = getMessages(currentLocale).calendar;
      return {
        prevMonth: messages.prevMonth,
        nextMonth: messages.nextMonth,
        startTime: messages.startTime,
        endTime: messages.endTime,
        weekdays: messages.weekdays,
      };
    };

    const getModalLabels = () => {
      const messages = getMessages(currentLocale).playbackModal;
      return { ...messages };
    };

    const getChromeLabels = () => {
      const messages = getMessages(currentLocale).playbackChrome;
      const isZh = currentLocale?.startsWith('zh');
      return {
        ...messages,
        selectRange: isZh ? '重新选择时间' : 'Select time',
        loading: isZh ? '正在连接回放视频' : 'Connecting playback video',
      };
    };

    const closePlaybackModal = () => {
      playbackPanelOpen = false;
      renderControls();
    };

    const playbackModal = mountPlaybackModal(shell, {
      locale: currentLocale,
      labels: getModalLabels(),
      calendarLabels: getCalendarLabels(),
      previewElement: videoEl,
      onStart: () => {
        const iso = buildPlaybackIso(playbackModal.getRange());
        if (!iso) return;
        runtimeStreamMode = 'playback';
        playbackPanelOpen = false;
        emitCommand('playbackRequest', currentProps.playbackOpenCommand, createRangePlaybackParams(iso));
        updateView();
      },
      onCancel: closePlaybackModal,
    });

    const syncPlaybackInputs = () => {
      playbackModal.setRangeFromProps(currentProps.playbackStart, currentProps.playbackEnd);
    };

    const openPlaybackSelector = () => {
      syncPlaybackInputs();
      playbackPanelOpen = true;
      renderControls();
    };

    const requestRecentPlayback = () => {
      runtimeStreamMode = 'playback';
      playbackPanelOpen = false;
      emitCommand('playbackRequest', currentProps.playbackOpenCommand, createRecentPlaybackParams());
      updateView();
    };

    const syncVideoTransport = () => {
      if (!internalVideo) return;
      internalVideo.controls = false;
      const resolvedObjectFit = currentProps.objectFit || 'cover';
      const resolvedObjectPosition = resolveObjectPosition(resolvedObjectFit);
      internalVideo.style.position = 'absolute';
      internalVideo.style.inset = '0';
      internalVideo.style.display = 'block';
      internalVideo.style.width = '100%';
      internalVideo.style.height = '100%';
      internalVideo.style.maxWidth = 'none';
      internalVideo.style.maxHeight = 'none';
      internalVideo.style.objectFit = resolvedObjectFit;
      internalVideo.style.objectPosition = resolvedObjectPosition;
      if (runtimeStreamMode === 'playback') {
        internalVideo.muted = false;
        internalVideo.playbackRate = PLAYBACK_SPEEDS[playbackSpeedIndex] ?? 1;
      }
    };

    const isPlaybackActive = () => runtimeStreamMode === 'playback';

    const returnToLive = () => {
      runtimeStreamMode = 'live';
      playbackPanelOpen = false;
      playbackSpeedIndex = 0;
      stopTransportTimer();
      if (internalVideo) {
        internalVideo.playbackRate = 1;
      }
      playbackChrome.setSpeedIndex(0);
      updateView();
    };

    const updatePlaybackChrome = () => {
      const showChrome =
        isPlaybackActive() && currentMode !== 'edit' && !playbackPanelOpen;
      playbackChrome.setActive(showChrome);
      if (!showChrome) return;

      const online = statusToBool(currentProps.onlineStatus);
      const recording = statusToBool(currentProps.recordingStatus);
      const ready = state === 'ready' && !!internalVideo;
      playbackChrome.updateState({
        deviceTitle: resolveDeviceTitle(currentLocale, currentProps.title),
        online,
        recording,
        paused: internalVideo?.paused ?? true,
        muted: internalVideo?.muted ?? false,
        volume: internalVideo?.volume ?? 0,
        currentTime: internalVideo?.currentTime ?? 0,
        duration: internalVideo?.duration ?? Number.NaN,
        speedIndex: playbackSpeedIndex,
        ready,
        scrubbing: scrubbingTransport,
      });
    };

    const renderPlaybackPanel = () => {
      const show =
        currentMode !== 'edit' && currentProps.showPlaybackControls && playbackPanelOpen;
      playbackModal.setOpen(show);
      if (show) {
        playbackModal.setRangeFromProps(currentProps.playbackStart, currentProps.playbackEnd);
      }
    };

    const startTransportTimer = () => {
      stopTransportTimer();
      if (!isPlaybackActive() || currentMode === 'edit') return;
      transportTimer = setInterval(updatePlaybackChrome, 250);
    };

    const bindInternalVideo = () => {
      const maybeVideo = (videoEl as any).video as HTMLVideoElement | undefined;
      if (!maybeVideo) {
        attachVideoRaf = requestAnimationFrame(bindInternalVideo);
        return;
      }
      if (internalVideo === maybeVideo) {
        syncVideoTransport();
        return;
      }
      internalVideo = maybeVideo;
      syncVideoTransport();
      markReadyIfPlayable();
      const refreshVideoFit = () => syncVideoTransport();
      internalVideo.addEventListener('loadeddata', () => {
        refreshVideoFit();
        updatePlaceholder('ready');
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('loadedmetadata', refreshVideoFit);
      internalVideo.addEventListener('canplay', () => {
        refreshVideoFit();
        updatePlaceholder('ready');
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('playing', () => {
        updatePlaceholder('ready');
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('pause', () => {
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('timeupdate', () => {
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('durationchange', updatePlaybackChrome);
      internalVideo.addEventListener('volumechange', () => {
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('error', () => updatePlaceholder('error'));
      internalVideo.addEventListener('stalled', () => {
        if (state !== 'ready') updatePlaceholder('error');
      });
      internalVideo.addEventListener('waiting', () => {
        if (state !== 'ready') updatePlaceholder('loading');
      });
    };

    const emitCommand = (eventName: string, command: string, params: Record<string, unknown>) => {
      const payload = commandPayload(command, params);
      if (!payload) return;
      currentCtx.emit?.(eventName, payload);
    };

    livePlayButton.addEventListener('click', () => {
      if (!internalVideo) return;
      if (internalVideo.paused) {
        void internalVideo.play();
      } else {
        internalVideo.pause();
      }
      syncLiveChrome();
    });

    liveVolumeButton.addEventListener('click', () => {
      if (!internalVideo) return;
      internalVideo.muted = !internalVideo.muted;
      syncLiveChrome();
    });

    liveVolumeTrack.addEventListener('input', () => {
      if (!internalVideo) return;
      internalVideo.volume = Math.max(0, Math.min(1, Number(liveVolumeTrack.value) / 100));
      internalVideo.muted = internalVideo.volume === 0;
      syncLiveChrome();
    });

    liveFullscreenButton.addEventListener('click', () => toggleFullscreen());

    const sendStop = () => {
      if (!activeDirection) return;
      activeDirection = null;
      emitCommand('ptzStop', currentProps.ptzStopCommand, {});
    };

    const sendMove = (direction: Direction) => {
      activeDirection = direction;
      emitCommand('ptzMove', currentProps.ptzMoveCommand, {
        direction,
        speed: currentProps.ptzSpeed,
      });
    };

    const isShellFullscreen = () => document.fullscreenElement === shell;

    const syncLiveChrome = () => {
      const isPlayback = isPlaybackActive();
      const showChrome = currentMode !== 'edit' && !playbackPanelOpen && !isPlayback;
      liveChrome.style.display = showChrome ? 'flex' : 'none';

      const messages = getMessages(currentLocale).buttons;
      const fullscreenTitle = isShellFullscreen()
        ? messages.exitFullscreen ?? 'Exit fullscreen'
        : messages.fullscreen ?? 'Fullscreen';
      liveFullscreenButton.title = fullscreenTitle;

      if (!internalVideo) {
        setIconButton(livePlayButton, 'pause', messages.pause ?? 'Pause');
        setIconButton(liveVolumeButton, 'volume', messages.mute ?? 'Mute');
        liveVolumeTrack.value = '80';
        return;
      }

      setIconButton(
        livePlayButton,
        internalVideo.paused ? 'play' : 'pause',
        internalVideo.paused ? messages.play ?? 'Play' : messages.pause ?? 'Pause',
      );
      const isMuted = internalVideo.muted || internalVideo.volume === 0;
      setIconButton(
        liveVolumeButton,
        isMuted ? 'muted' : 'volume',
        isMuted ? messages.unmute ?? 'Unmute' : messages.mute ?? 'Mute',
      );
      liveVolumeTrack.value = String(Math.round((isMuted ? 0 : internalVideo.volume) * 100));
    };

    const toggleFullscreen = () => {
      if (isShellFullscreen()) {
        void document.exitFullscreen?.();
        return;
      }
      void shell.requestFullscreen?.();
    };

    const handleFullscreenChange = () => {
      syncLiveChrome();
      renderControls();
    };

    const playbackChrome = mountPlaybackChrome(shell, {
      videoElement: videoEl,
      placeholderElement: placeholder,
      labels: getChromeLabels(),
      onPlayPause: () => {
        if (!internalVideo) return;
        if (internalVideo.paused) {
          void internalVideo.play();
        } else {
          internalVideo.pause();
        }
        updatePlaybackChrome();
      },
      onVolumeChange: (volume) => {
        if (!internalVideo) return;
        internalVideo.volume = Math.max(0, Math.min(1, volume / 100));
        if (internalVideo.volume > 0) internalVideo.muted = false;
        updatePlaybackChrome();
      },
      onMuteToggle: () => {
        if (!internalVideo) return;
        internalVideo.muted = !internalVideo.muted;
        updatePlaybackChrome();
      },
      onSeek: (ratio) => {
        if (!internalVideo) return;
        const duration = internalVideo.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        internalVideo.currentTime = ratio * duration;
        updatePlaybackChrome();
      },
      onSpeedChange: (index) => {
        playbackSpeedIndex = index;
        if (internalVideo) {
          internalVideo.playbackRate = PLAYBACK_SPEEDS[playbackSpeedIndex] ?? 1;
        }
        updatePlaybackChrome();
      },
      onSnapshot: () => emitCommand('snapshot', currentProps.snapshotCommand, {}),
      onFullscreen: toggleFullscreen,
      onReturnToLive: returnToLive,
      onSelectRange: openPlaybackSelector,
      onScrubStart: () => {
        scrubbingTransport = true;
      },
      onScrubEnd: () => {
        scrubbingTransport = false;
      },
    });

    const renderStatusBar = () => {
      const messages = getMessages(currentLocale).runtime;
      statusBar.innerHTML = '';
      if (!currentProps.showStatusBar) return;

      const streamMode = isPlaybackActive() ? messages.playback : messages.live;
      const online = statusToBool(currentProps.onlineStatus);
      const recording = statusToBool(currentProps.recordingStatus);
      const items: Array<{ label: string; className: string }> = [
        { label: streamMode, className: isPlaybackActive() ? 'is-playback' : 'is-live' },
      ];

      if (online !== undefined) {
        items.push({
          label: online ? messages.online : messages.offline,
          className: online ? 'is-online' : 'is-offline',
        });
      }

      if (recording !== undefined) {
        items.push({
          label: recording ? messages.recording : messages.idleRecord,
          className: recording ? 'is-recording' : 'is-idle-record',
        });
      }

      items.forEach((item) => {
        const chip = document.createElement('span');
        chip.className = `tv-camera-status-chip ${item.className}`;
        const dot = document.createElement('span');
        dot.className = 'tv-camera-status-dot';
        const label = document.createElement('span');
        label.textContent = item.label;
        chip.append(dot, label);
        statusBar.appendChild(chip);
      });
    };

    const renderControls = () => {
      const messages = getMessages(currentLocale).buttons;
      const isPlayback = isPlaybackActive();
      const usePlaybackModalLayout = playbackPanelOpen;
      ptzPanel.innerHTML = '';
      actionPanel.innerHTML = '';
      const showToolbar = currentMode !== 'edit' && !playbackPanelOpen;
      const showLiveChrome = currentMode !== 'edit' && !playbackPanelOpen && !isPlayback;
      const showPlaybackChrome = isPlayback && currentMode !== 'edit' && !playbackPanelOpen;
      const showPtzPad = false;
      element.style.padding = usePlaybackModalLayout ? '0' : '8px 14px 10px';
      topBar.style.display = usePlaybackModalLayout ? 'none' : 'flex';
      actionPanel.style.display = showToolbar ? 'flex' : 'none';
      topBarSpacer.style.display = showToolbar ? 'block' : 'none';
      statusBar.style.display = showToolbar && currentProps.showStatusBar ? 'flex' : 'none';
      const showLiveTitle = !usePlaybackModalLayout && !isPlayback && currentProps.showTitle;
      liveHeader.style.display = showLiveTitle ? 'inline-flex' : 'none';
      if (usePlaybackModalLayout || isPlayback) {
        placeholder.style.display = 'none';
      }
      videoStage.style.left = '0';
      videoStage.style.right = '0';
      videoStage.style.top = '0';
      videoStage.style.bottom = showLiveChrome
        ? `${LIVE_CHROME_HEIGHT}px`
        : showPlaybackChrome
          ? `${PLAYBACK_CHROME_HEIGHT}px`
          : '0';
      videoStage.style.borderRadius = '0';
      videoEl.style.position = 'absolute';
      videoEl.style.inset = '0';
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.zIndex = '1';
      syncVideoTransport();
      syncLiveChrome();
      ptzPanel.style.display = showPtzPad && !isPlayback ? 'grid' : 'none';
      renderPlaybackPanel();
      updatePlaybackChrome();
      if (currentMode === 'edit') {
        playbackModal.setOpen(false);
        playbackChrome.setActive(false);
        return;
      }

      if (showPtzPad) {
        const buttonClass = 'tv-camera-control-button';
        const positions: Array<[number, string | null, string, Direction | null]> = [
          [1, 'up', '↑', 'up'],
          [3, 'left', '←', 'left'],
          [4, 'stop', '■', null],
          [5, 'right', '→', 'right'],
          [7, 'down', '↓', 'down'],
        ];
        positions.forEach(([index, key, label, direction]) => {
          const cell = document.createElement('div');
          cell.style.gridColumn = `${(index % 3) + 1}`;
          cell.style.gridRow = `${Math.floor(index / 3) + 1}`;
          if (!key) {
            ptzPanel.appendChild(cell);
            return;
          }
          const button = makeButton(label, messages[key] || key, buttonClass);
          if (direction) {
            button.addEventListener('pointerdown', (event) => {
              event.preventDefault();
              sendMove(direction);
            });
            button.addEventListener('pointerup', sendStop);
            button.addEventListener('pointerleave', sendStop);
            button.addEventListener('pointercancel', sendStop);
          } else {
            button.addEventListener('click', sendStop);
          }
          cell.appendChild(button);
          ptzPanel.appendChild(cell);
        });
      }

      const addAction = (icon: string, text: string, title: string, onClick: () => void) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tv-camera-action-button';
        button.title = title;
        const iconEl = document.createElement('span');
        iconEl.className = 'tv-camera-action-icon';
        iconEl.setAttribute('aria-hidden', 'true');
        iconEl.textContent = icon;
        const textEl = document.createElement('span');
        textEl.className = 'tv-camera-action-text';
        textEl.textContent = text;
        button.append(iconEl, textEl);
        button.addEventListener('click', onClick);
        actionPanel.appendChild(button);
      };
      const addPlainAction = (label: string, title: string, onClick: () => void) => {
        const button = makeButton(label, title, 'tv-camera-action-button');
        button.addEventListener('click', onClick);
        actionPanel.appendChild(button);
      };
      const buttonTitle = (key: string, fallback: string) => messages[key] ?? fallback;

      if (!isPlayback && currentProps.showZoomControls) {
        addPlainAction('+', buttonTitle('zoomIn', 'Zoom in'), () =>
          emitCommand('ptzZoom', currentProps.ptzZoomCommand, {
            action: 'in',
            speed: currentProps.ptzSpeed,
          }),
        );
        addPlainAction('-', buttonTitle('zoomOut', 'Zoom out'), () =>
          emitCommand('ptzZoom', currentProps.ptzZoomCommand, {
            action: 'out',
            speed: currentProps.ptzSpeed,
          }),
        );
      }

      if (!isPlayback && currentProps.showFocusControls) {
        addPlainAction(buttonTitle('focusNear', 'Focus near'), buttonTitle('focusNear', 'Focus near'), () =>
          emitCommand('ptzFocus', currentProps.ptzFocusCommand, { action: 'near' }),
        );
        addPlainAction(buttonTitle('focusFar', 'Focus far'), buttonTitle('focusFar', 'Focus far'), () =>
          emitCommand('ptzFocus', currentProps.ptzFocusCommand, { action: 'far' }),
        );
      }

      if (!isPlayback && currentProps.showPresetControl) {
        addPlainAction(buttonTitle('preset', 'Preset'), buttonTitle('preset', 'Preset'), () =>
          emitCommand('presetGoto', currentProps.presetGotoCommand, {
            presetId: currentProps.presetId,
          }),
        );
      }

      if (currentProps.showSnapshot) {
        addAction('▣', buttonTitle('snapshot', 'Snapshot'), buttonTitle('snapshot', 'Snapshot'), () =>
          emitCommand('snapshot', currentProps.snapshotCommand, {}),
        );
      }

      if (currentProps.showFullscreen) {
        const fullscreenLabel = isShellFullscreen()
          ? buttonTitle('exitFullscreen', currentLocale?.startsWith('zh') ? '退出全屏' : 'Exit fullscreen')
          : buttonTitle('fullscreen', 'Fullscreen');
        addAction('⛶', fullscreenLabel, fullscreenLabel, toggleFullscreen);
      }

      if (isPlayback) {
        const chromeLabels = getChromeLabels();
        addAction(
          '▷',
          chromeLabels.selectRange ?? 'Select time',
          chromeLabels.selectRange ?? 'Select time',
          openPlaybackSelector,
        );
        addAction(
          '↩',
          buttonTitle('returnToLive', 'Return to live'),
          buttonTitle('returnToLive', 'Return to live'),
          returnToLive,
        );
      } else if (currentProps.showPlaybackControls) {
        addAction('▷', buttonTitle('playback', 'Playback'), buttonTitle('playback', 'Playback'), requestRecentPlayback);
      }
    };

    const updateStyles = () => {
      shell.style.border = '0';
      shell.style.borderRadius = '0';
      shell.style.boxSizing = 'border-box';
      shell.style.boxShadow = 'none';
      const resolvedObjectFit = currentProps.objectFit || 'cover';
      const resolvedObjectPosition = resolveObjectPosition(resolvedObjectFit);
      styleEl.textContent = `
        [data-thingsvis-overlay="media-camera-control"] {
          container-type: inline-size;
          container-name: tv-camera;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar {
          opacity: ${currentProps.panelOpacity};
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          width: 100% !important;
          -ms-overflow-style: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar::-webkit-scrollbar {
          display: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-bar,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-panel {
          display: flex;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          flex: 0 0 auto !important;
          width: auto !important;
          max-width: none !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar-spacer {
          flex: 1 1 auto;
          min-width: 4px;
        }
        [data-thingsvis-overlay="media-camera-control"] video-rtc {
          position: absolute !important;
          inset: 0 !important;
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        [data-thingsvis-overlay="media-camera-control"] video-rtc video {
          position: absolute !important;
          inset: 0 !important;
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: ${resolvedObjectFit} !important;
          object-position: ${resolvedObjectPosition} !important;
        }
        [data-thingsvis-overlay="media-camera-control"] video-rtc video::-webkit-media-controls {
          display: none !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-chrome {
          opacity: ${currentProps.panelOpacity};
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-panel {
          opacity: ${currentProps.panelOpacity};
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal {
          opacity: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 22px;
          padding: 0;
          border-radius: 0;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          color: rgba(255,255,255,0.74);
          background: transparent;
          border: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-online.is-online {
          color: #35df72;
          background: transparent;
          border-color: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-online.is-offline {
          color: rgba(255,255,255,0.68);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-recording.is-recording {
          color: #fff;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-mode .tv-camera-status-dot {
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.16), 0 0 14px rgba(59,130,246,0.48);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-online.is-online .tv-camera-status-dot {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.14), 0 0 14px rgba(74,222,128,0.48);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-recording.is-recording .tv-camera-status-dot {
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.15), 0 0 14px rgba(239,68,68,0.58);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 8px;
          border-radius: 0;
          border: 0;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 11px;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-action:hover {
          background: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn {
          width: 26px;
          height: 26px;
          border: none;
          border-radius: 0;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn svg {
          width: 18px;
          height: 18px;
          display: block;
          margin: 0 auto;
          fill: currentColor;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn:hover {
          background: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn:disabled,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-select:disabled,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-progress:disabled,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-volume:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-progress,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-volume {
          flex: 1 1 0;
          min-width: 0;
          height: 4px;
          margin: 0;
          accent-color: #2d7cf6;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-select {
          height: 26px;
          padding: 0 4px;
          border-radius: 0;
          border: 0;
          color: #fff;
          background: transparent;
          font-size: 12px;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn {
          height: 32px;
          min-width: 76px;
          padding: 0 12px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-secondary {
          color: rgba(255,255,255,0.86);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-secondary:hover {
          color: #fff;
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.28);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-primary {
          color: #fff;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-color: rgba(96,165,250,0.78);
          box-shadow: 0 8px 20px rgba(37,99,235,0.28);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-primary:hover {
          background: linear-gradient(180deg, #60a5fa 0%, #2f7dff 100%);
          box-shadow: 0 10px 24px rgba(47,125,255,0.36);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn:active {
          transform: translateY(1px);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-thumb {
          position: absolute;
          left: 0;
          width: 100%;
          height: 10px;
          margin: 0;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-thumb-start {
          z-index: 2;
          pointer-events: auto;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-thumb-end {
          z-index: 3;
          pointer-events: auto;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #fff;
          border: 2px solid #60a5fa;
          box-shadow: 0 3px 10px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.5);
          pointer-events: auto;
          cursor: pointer;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #fff;
          border: 2px solid #60a5fa;
          box-shadow: 0 3px 10px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.5);
          pointer-events: auto;
          cursor: pointer;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-close:hover {
          background: transparent;
          border-color: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-track::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 16px;
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.18) 0,
            rgba(255,255,255,0.18) 1px,
            transparent 1px,
            transparent calc(100% / 48)
          );
          pointer-events: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          font-size: 13px;
          line-height: 1;
          color: rgba(255,255,255,0.96);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-video-stage {
          box-shadow: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          flex: 0 0 auto;
          padding: 0;
          border: none;
          border-radius: 0;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-icon svg {
          width: 18px;
          height: 18px;
          display: block;
          fill: currentColor;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-icon:hover {
          background: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track {
          width: 86px;
          max-width: 12vw;
          height: 4px;
          flex: 0 1 86px;
          margin: 0;
          accent-color: #2f7dff;
          background: transparent;
          cursor: pointer;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select {
          flex: 0 0 auto;
          min-width: 46px;
          height: 26px;
          padding: 0 4px;
          border: none;
          border-radius: 0;
          color: rgba(255,255,255,0.84);
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select:hover {
          background: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-placeholder {
          box-shadow: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-placeholder-text {
          max-width: min(360px, 86%);
          padding: 0;
          border-radius: 0;
          color: rgba(255,255,255,0.82);
          background: transparent;
          border: 0;
          box-shadow: none;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 22px;
          padding: 0;
          color: rgba(255,255,255,0.74);
          background: transparent;
          border: 0;
          box-shadow: none;
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.48);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.08);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-live .tv-camera-status-dot {
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.16), 0 0 14px rgba(59,130,246,0.48);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-online {
          color: #35df72;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-online .tv-camera-status-dot {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.14), 0 0 14px rgba(74,222,128,0.48);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-offline,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-idle-record {
          color: rgba(255,255,255,0.68);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-recording {
          color: #fff;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-recording .tv-camera-status-dot {
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.15), 0 0 14px rgba(239,68,68,0.58);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          height: 30px;
          min-width: 30px;
          border: 0;
          border-radius: 0;
          color: rgba(255,255,255,0.86);
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          box-sizing: border-box;
          box-shadow: none;
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: auto;
          max-width: none;
          padding: 0 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-icon {
          flex: 0 0 auto;
          line-height: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-text {
          flex: 0 0 auto;
          line-height: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-datetime-input {
          width: 100%;
          height: 34px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          color: #fff;
          background: rgba(0,0,0,0.58);
          font-size: 12px;
          padding: 0 8px;
          box-sizing: border-box;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-datetime-input:focus {
          outline: none;
          border-color: rgba(64, 158, 255, 0.55);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-nav {
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 0;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
          padding: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-nav:hover {
          background: transparent;
          border-color: transparent;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-day:hover {
          border-color: rgba(96, 165, 250, 0.82) !important;
          background: rgba(59, 130, 246, 0.24) !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:hover,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:hover {
          background: transparent;
          border-color: transparent;
          box-shadow: none;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:active,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:active {
          transform: translateY(1px);
          background: transparent;
          border-color: transparent;
        }
        @container tv-camera (max-width: 480px) {
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-bar {
            gap: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip {
            font-size: 12px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-panel {
            gap: 2px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-text {
            display: none !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
            height: 28px !important;
            min-width: 28px !important;
            padding: 0 4px !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 720px) {
          [data-thingsvis-overlay="media-camera-control"] {
            padding: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar {
            align-items: center !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip {
            min-height: 22px !important;
            padding: 0 !important;
            font-size: 13px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-panel {
            gap: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
            height: 30px !important;
            min-width: 30px !important;
            padding: 0 8px !important;
            font-size: 12px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-header {
            top: 8px !important;
            left: 8px !important;
            right: auto !important;
            max-width: calc(100% - 16px) !important;
            padding: 6px 10px !important;
            font-size: 13px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-video-stage {
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 48px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome {
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 48px !important;
            gap: 6px !important;
            padding: 0 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-time,
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select {
            display: none !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track {
            width: 64px !important;
            max-width: 18vw !important;
            flex-basis: 64px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal {
            padding: 0 !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-header {
            padding: 4px 12px 0 !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-body {
            padding: 0 12px !important;
            overflow: auto !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-section,
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-footer {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-footer {
            align-items: center !important;
            flex-direction: row !important;
            padding-top: 4px !important;
            padding-bottom: 5px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-selection {
            font-size: 10px !important;
          }
        }
      `;
    };

    const updateView = () => {
      const messages = getMessages(currentLocale).runtime;
      const source = isPlaybackActive() ? currentProps.playbackUrl : currentProps.streamUrl;
      const normalizedSrc = normalizeSource(source);

      const showTitle =
        currentProps.showTitle && !isPlaybackActive() && !playbackPanelOpen;
      liveTitleLabel.textContent = showTitle
        ? resolveDeviceTitle(currentLocale, currentProps.title)
        : '';

      renderStatusBar();
      renderControls();
      updateStyles();
      syncVideoTransport();

      if (currentMode === 'edit') {
        stopReadyPoll();
        currentSrc = '';
        videoEl.style.display = 'none';
        videoEl.removeAttribute('src');
        updatePlaceholder(normalizedSrc ? 'idle' : 'empty');
        placeholderText.textContent = normalizedSrc ? messages.idle : messages.empty;
        return;
      }

      videoEl.mode = currentProps.streamMode;
      videoEl.visibilityThreshold = currentProps.visibilityThreshold;

      if (!normalizedSrc) {
        stopReadyPoll();
        currentSrc = '';
        videoEl.style.display = 'none';
        videoEl.removeAttribute('src');
        updatePlaceholder('empty');
        if (isPlaybackActive()) {
          placeholder.style.display = 'none';
          placeholderText.textContent = currentLocale?.startsWith('zh')
            ? '等待平台返回回放流'
            : 'Waiting for playback stream';
        }
        return;
      }

      videoEl.style.display = 'block';
      if (currentSrc !== normalizedSrc) {
        currentSrc = normalizedSrc;
        updatePlaceholder('loading');
        if (isPlaybackActive()) {
          placeholder.style.display = 'none';
          placeholderText.textContent = currentLocale?.startsWith('zh')
            ? '正在连接回放视频'
            : 'Connecting playback video';
        }
        videoEl.src = normalizedSrc;
        if (!currentProps.autoplay) {
          requestAnimationFrame(() => internalVideo?.pause());
        }
        startReadyPoll();
        return;
      }

      markReadyIfPlayable();
      startTransportTimer();
    };

    bindInternalVideo();
    syncPlaybackInputs();
    updateView();

    window.addEventListener('blur', sendStop);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        const prevPlaybackUrl = currentProps.playbackUrl;
        currentProps = newProps;
        currentCtx = newCtx;
        currentLocale = newCtx.locale;
        playbackModal.updateLabels(getModalLabels(), getCalendarLabels(), currentLocale);
        playbackChrome.updateLabels(getChromeLabels());
        playbackModal.setRangeFromProps(currentProps.playbackStart, currentProps.playbackEnd);
        const nextMode = newCtx.mode ?? currentMode;
        if (nextMode === 'edit' && currentMode !== 'edit') {
          runtimeStreamMode = newProps.mode === 'playback' ? 'playback' : 'live';
          playbackPanelOpen = false;
        }
        currentMode = nextMode;
        colors = resolveWidgetColors(element);
        syncPlaybackInputs();
        if (
          isPlaybackActive() &&
          normalizeSource(newProps.playbackUrl) &&
          normalizeSource(newProps.playbackUrl) !== normalizeSource(prevPlaybackUrl)
        ) {
          currentSrc = '';
        }
        updateView();
      },
      destroy: () => {
        sendStop();
        window.removeEventListener('blur', sendStop);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        if (attachVideoRaf) cancelAnimationFrame(attachVideoRaf);
        stopReadyPoll();
        stopTransportTimer();
        playbackModal.destroy();
        playbackChrome.destroy();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
