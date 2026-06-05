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

function getMessages(locale: string | undefined): RuntimeMessages {
  return resolveLocaleRecord(localeCatalog, locale, 'zh') as RuntimeMessages;
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
  const identify = normalizeCommand(command);
  return identify ? { [identify]: params } : null;
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
      padding: 18px 36px 24px;
    `;

    const styleEl = document.createElement('style');
    element.appendChild(styleEl);

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'display:none;';
    element.appendChild(titleEl);

    const topBar = document.createElement('div');
    topBar.className = 'tv-camera-topbar';
    topBar.style.cssText = `
      flex:0 0 auto;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      min-height:48px;
      margin-bottom:18px;
    `;
    element.appendChild(topBar);

    const statusBar = document.createElement('div');
    statusBar.className = 'tv-camera-status-bar';
    statusBar.style.cssText = `
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:12px;
      min-width:0;
      pointer-events:none;
    `;
    topBar.appendChild(statusBar);

    const toolbar = document.createElement('div');
    toolbar.className = 'tv-camera-toolbar';
    toolbar.style.cssText = `
      display:none;
      align-items:center;
      justify-content:flex-end;
      flex-wrap:wrap;
      gap:16px;
      min-width:0;
      box-sizing:border-box;
    `;
    topBar.appendChild(toolbar);

    const shell = document.createElement('div');
    shell.className = 'tv-camera-shell';
    shell.style.cssText =
      'position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:rgba(20,28,42,0.78);box-sizing:border-box;';
    element.appendChild(shell);

    const liveHeader = document.createElement('div');
    liveHeader.className = 'tv-camera-live-header';
    liveHeader.style.cssText = `
      position:relative;
      z-index:3;
      display:flex;
      align-items:center;
      gap:12px;
      height:56px;
      padding:0 20px;
      box-sizing:border-box;
      color:rgba(255,255,255,0.92);
      font-size:18px;
      font-weight:700;
      line-height:1;
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
      left:18px;
      right:18px;
      top:72px;
      bottom:80px;
      overflow:hidden;
      border-radius:8px;
      background:#030712;
    `;
    shell.appendChild(videoStage);

    const videoEl: any = document.createElement('video-rtc');
    videoEl.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1;';
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
      left:18px;
      right:18px;
      bottom:12px;
      z-index:3;
      display:none;
      align-items:center;
      gap:18px;
      height:64px;
      padding:0 22px;
      box-sizing:border-box;
      color:#fff;
      background:linear-gradient(180deg, rgba(21,27,38,0.72), rgba(15,20,30,0.92));
      border:1px solid rgba(255,255,255,0.08);
      border-radius:0 0 8px 8px;
      box-shadow:0 -16px 32px rgba(0,0,0,0.26);
    `;
    shell.appendChild(liveChrome);

    const livePlayButton = makeButton('▮▮', 'Pause', 'tv-camera-live-chrome-icon');
    liveChrome.appendChild(livePlayButton);

    const liveVolumeButton = makeButton('◖', 'Mute', 'tv-camera-live-chrome-icon');
    liveChrome.appendChild(liveVolumeButton);

    const liveVolumeTrack = document.createElement('div');
    liveVolumeTrack.className = 'tv-camera-live-volume-track';
    const liveVolumeFill = document.createElement('span');
    liveVolumeTrack.appendChild(liveVolumeFill);
    liveChrome.appendChild(liveVolumeTrack);

    const liveTime = document.createElement('span');
    liveTime.className = 'tv-camera-live-time';
    liveTime.textContent = '00:12:36 / 01:00:00';
    liveChrome.appendChild(liveTime);

    const liveProgress = document.createElement('div');
    liveProgress.className = 'tv-camera-live-progress';
    const liveProgressFill = document.createElement('span');
    const liveProgressKnob = document.createElement('i');
    liveProgress.append(liveProgressFill, liveProgressKnob);
    liveChrome.appendChild(liveProgress);

    const liveQualityButton = makeButton('HD⌄', 'HD', 'tv-camera-live-chrome-select');
    liveChrome.appendChild(liveQualityButton);

    const liveSpeedButton = makeButton('1.0x⌄', 'Speed', 'tv-camera-live-chrome-select');
    liveChrome.appendChild(liveSpeedButton);

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

    const actionPanel = document.createElement('div');
    actionPanel.className = 'tv-camera-action-panel';
    actionPanel.style.cssText =
      'display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:16px;min-width:0;';
    toolbar.appendChild(actionPanel);

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
      return { ...messages };
    };

    const closePlaybackModal = () => {
      playbackPanelOpen = false;
      renderPlaybackPanel();
      updatePlaybackChrome();
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
        emitCommand('playbackRequest', currentProps.playbackOpenCommand, iso);
        updateView();
      },
      onCancel: closePlaybackModal,
    });

    const syncPlaybackInputs = () => {
      playbackModal.setRangeFromProps(currentProps.playbackStart, currentProps.playbackEnd);
    };

    const syncVideoTransport = () => {
      if (!internalVideo) return;
      internalVideo.controls = false;
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
        isPlaybackActive() && currentMode !== 'edit' && !playbackPanelOpen && state === 'ready';
      playbackChrome.setActive(showChrome);
      if (!showChrome || !internalVideo) return;

      const online = statusToBool(currentProps.onlineStatus);
      const recording = statusToBool(currentProps.recordingStatus);
      playbackChrome.updateState({
        deviceTitle: currentProps.title || 'Camera',
        online,
        recording,
        paused: internalVideo.paused,
        muted: internalVideo.muted,
        volume: internalVideo.volume,
        currentTime: internalVideo.currentTime,
        duration: internalVideo.duration,
        speedIndex: playbackSpeedIndex,
        ready: true,
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
      internalVideo.addEventListener('loadeddata', () => {
        updatePlaceholder('ready');
        updatePlaybackChrome();
        syncLiveChrome();
      });
      internalVideo.addEventListener('canplay', () => {
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
        livePlayButton.textContent = '▮▮';
        livePlayButton.title = messages.pause ?? 'Pause';
        liveVolumeButton.textContent = '◖';
        liveVolumeButton.title = messages.mute ?? 'Mute';
        return;
      }

      livePlayButton.textContent = internalVideo.paused ? '▶' : '▮▮';
      livePlayButton.title = internalVideo.paused
        ? messages.play ?? 'Play'
        : messages.pause ?? 'Pause';
      liveVolumeButton.textContent = internalVideo.muted || internalVideo.volume === 0 ? '◌' : '◖';
      liveVolumeButton.title =
        internalVideo.muted || internalVideo.volume === 0
          ? messages.unmute ?? 'Unmute'
          : messages.mute ?? 'Mute';
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
      ptzPanel.innerHTML = '';
      actionPanel.innerHTML = '';
      const showToolbar = currentMode !== 'edit' && !playbackPanelOpen && !isPlayback;
      const showPtzPad = false;
      toolbar.style.display = showToolbar ? 'flex' : 'none';
      statusBar.style.display = showToolbar && currentProps.showStatusBar ? 'flex' : 'none';
      liveHeader.style.display = isPlayback ? 'none' : 'flex';
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

      const addAction = (label: string, title: string, onClick: () => void) => {
        const button = makeButton(label, title, 'tv-camera-action-button');
        button.addEventListener('click', onClick);
        actionPanel.appendChild(button);
      };
      const buttonTitle = (key: string, fallback: string) => messages[key] ?? fallback;

      if (!isPlayback && currentProps.showZoomControls) {
        addAction('+', buttonTitle('zoomIn', 'Zoom in'), () =>
          emitCommand('ptzZoom', currentProps.ptzZoomCommand, {
            action: 'in',
            speed: currentProps.ptzSpeed,
          }),
        );
        addAction('-', buttonTitle('zoomOut', 'Zoom out'), () =>
          emitCommand('ptzZoom', currentProps.ptzZoomCommand, {
            action: 'out',
            speed: currentProps.ptzSpeed,
          }),
        );
      }

      if (!isPlayback && currentProps.showFocusControls) {
        addAction(buttonTitle('focusNear', 'Focus near'), buttonTitle('focusNear', 'Focus near'), () =>
          emitCommand('ptzFocus', currentProps.ptzFocusCommand, { action: 'near' }),
        );
        addAction(buttonTitle('focusFar', 'Focus far'), buttonTitle('focusFar', 'Focus far'), () =>
          emitCommand('ptzFocus', currentProps.ptzFocusCommand, { action: 'far' }),
        );
      }

      if (!isPlayback && currentProps.showPresetControl) {
        addAction(buttonTitle('preset', 'Preset'), buttonTitle('preset', 'Preset'), () =>
          emitCommand('presetGoto', currentProps.presetGotoCommand, {
            presetId: currentProps.presetId,
          }),
        );
      }

      if (currentProps.showSnapshot) {
        addAction(`▣ ${buttonTitle('snapshot', 'Snapshot')}`, buttonTitle('snapshot', 'Snapshot'), () =>
          emitCommand('snapshot', currentProps.snapshotCommand, {}),
        );
      }

      if (currentProps.showFullscreen) {
        const fullscreenLabel = isShellFullscreen()
          ? buttonTitle('exitFullscreen', currentLocale?.startsWith('zh') ? '退出全屏' : 'Exit fullscreen')
          : buttonTitle('fullscreen', 'Fullscreen');
        addAction(`⛶ ${fullscreenLabel}`, fullscreenLabel, toggleFullscreen);
      }

      if (!isPlayback && currentProps.showPlaybackControls) {
        addAction(`▷ ${buttonTitle('playback', 'Playback')}`, buttonTitle('playback', 'Playback'), () => {
          syncPlaybackInputs();
          playbackPanelOpen = true;
          renderPlaybackPanel();
          updatePlaybackChrome();
        });
      }
    };

    const updateStyles = () => {
      titleEl.style.color = colors.fg;
      const shellRadius =
        currentProps.borderRadius === 0 ? 0 : Math.max(currentProps.borderRadius, 16);
      shell.style.border =
        currentProps.borderWidth > 0
          ? `${currentProps.borderWidth}px solid ${currentProps.borderColor}`
          : '1px solid rgba(255,255,255,0.08)';
      shell.style.borderRadius = shellRadius === 0 ? '0' : `${shellRadius}px`;
      shell.style.boxSizing = 'border-box';
      shell.style.boxShadow =
        '0 18px 48px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)';
      styleEl.textContent = `
        [data-thingsvis-overlay="media-camera-control"] video-rtc video {
          object-fit: ${currentProps.objectFit} !important;
        }
        [data-thingsvis-overlay="media-camera-control"] video-rtc video::-webkit-media-controls {
          display: none !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-toolbar,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-chrome {
          opacity: ${currentProps.panelOpacity};
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal {
          opacity: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          line-height: 18px;
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-online.is-online {
          color: #4ade80;
          background: rgba(34, 197, 94, 0.18);
          border-color: rgba(34, 197, 94, 0.35);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-online.is-offline {
          color: rgba(255,255,255,0.55);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-chip-recording.is-recording {
          color: #fff;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-rec-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #ef4444;
          display: inline-block;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
          background: rgba(0,0,0,0.45);
          cursor: pointer;
          font-size: 12px;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-action:hover {
          background: rgba(255,255,255,0.1);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-chrome-icon-btn:hover {
          background: rgba(255,255,255,0.08);
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
          height: 28px;
          padding: 0 8px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
          background: rgba(0,0,0,0.45);
          font-size: 12px;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn {
          height: 46px;
          min-width: 112px;
          padding: 0 22px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.14);
          transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-secondary {
          color: rgba(255,255,255,0.86);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-secondary:hover {
          color: #fff;
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.34);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-primary {
          color: #fff;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-color: rgba(96,165,250,0.8);
          box-shadow: 0 10px 28px rgba(37,99,235,0.36);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-btn-primary:hover {
          background: linear-gradient(180deg, #60a5fa 0%, #2f7dff 100%);
          box-shadow: 0 12px 34px rgba(47,125,255,0.46);
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
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.3);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-preview-play {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 999px;
          color: #fff;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 12px 34px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          font-size: 34px;
          line-height: 1;
          text-indent: 5px;
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
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar {
          opacity: ${currentProps.panelOpacity};
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          font-size: 22px;
          line-height: 1;
          color: rgba(255,255,255,0.96);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-video-stage {
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          padding: 0;
          border: none;
          border-radius: 8px;
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-icon:hover {
          background: rgba(255,255,255,0.08);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track {
          position: relative;
          width: 170px;
          max-width: 14vw;
          height: 8px;
          flex: 0 1 170px;
          border-radius: 999px;
          background: rgba(148,163,184,0.28);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track span {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 76%;
          border-radius: inherit;
          background: #2f7dff;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track::after {
          content: "";
          position: absolute;
          left: 76%;
          top: 50%;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #fff;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.38);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-time {
          flex: 0 0 auto;
          color: rgba(255,255,255,0.78);
          font-size: 16px;
          font-weight: 600;
          white-space: nowrap;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-progress {
          position: relative;
          height: 8px;
          flex: 1 1 260px;
          min-width: 120px;
          border-radius: 999px;
          background: rgba(148,163,184,0.22);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-progress span {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 34%;
          border-radius: inherit;
          background: #2f7dff;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-progress i {
          position: absolute;
          left: 34%;
          top: 50%;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #2f7dff;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 3px rgba(47,125,255,0.18);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select {
          flex: 0 0 auto;
          min-width: 70px;
          height: 34px;
          padding: 0 8px;
          border: none;
          border-radius: 8px;
          color: rgba(255,255,255,0.84);
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select:hover {
          background: rgba(255,255,255,0.08);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-placeholder {
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-placeholder-text {
          max-width: min(360px, 86%);
          padding: 12px 16px;
          border-radius: 10px;
          color: rgba(255,255,255,0.82);
          background: rgba(0,0,0,0.34);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 14px 36px rgba(0,0,0,0.28);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          color: rgba(255,255,255,0.74);
          background: rgba(28,35,48,0.72);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 12px 32px rgba(0,0,0,0.22);
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          backdrop-filter: blur(8px);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-dot {
          width: 12px;
          height: 12px;
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
          background: rgba(20,83,45,0.54);
          border-color: rgba(74,222,128,0.18);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-online .tv-camera-status-dot {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.14), 0 0 14px rgba(74,222,128,0.48);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-offline,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-idle-record {
          color: rgba(255,255,255,0.68);
          background: rgba(15,23,42,0.58);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-recording {
          color: #fff;
          background: rgba(28,35,48,0.72);
          border-color: rgba(255,255,255,0.05);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip.is-recording .tv-camera-status-dot {
          background: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.15), 0 0 14px rgba(239,68,68,0.58);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          height: 54px;
          min-width: 54px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 12px;
          color: #fff;
          background: rgba(13,18,29,0.62);
          cursor: pointer;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          box-sizing: border-box;
          box-shadow: 0 12px 28px rgba(0,0,0,0.18);
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          width: auto;
          max-width: 148px;
          padding: 0 22px;
          white-space: nowrap;
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
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #fff;
          background: rgba(255,255,255,0.08);
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          padding: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-nav:hover {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.3);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-day:hover {
          border-color: rgba(96, 165, 250, 0.82) !important;
          background: rgba(59, 130, 246, 0.24) !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:hover,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:hover {
          background: rgba(30,41,59,0.9);
          border-color: rgba(96,165,250,0.38);
          box-shadow: 0 10px 28px rgba(0,0,0,0.28), 0 0 0 1px rgba(96,165,250,0.12);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:active,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:active {
          transform: translateY(1px);
          background: rgba(37, 99, 235, 0.45);
          border-color: rgba(96, 165, 250, 0.68);
        }
        @media (max-width: 720px) {
          [data-thingsvis-overlay="media-camera-control"] {
            padding: 12px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-topbar {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-status-chip {
            min-height: 36px !important;
            padding: 0 12px !important;
            font-size: 14px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-panel {
            gap: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
            height: 40px !important;
            min-width: 40px !important;
            padding: 0 12px !important;
            font-size: 14px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-header {
            height: 44px !important;
            padding: 0 12px !important;
            font-size: 14px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-video-stage {
            left: 10px !important;
            right: 10px !important;
            top: 54px !important;
            bottom: 58px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome {
            left: 10px !important;
            right: 10px !important;
            bottom: 8px !important;
            height: 48px !important;
            gap: 8px !important;
            padding: 0 10px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-volume-track,
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-time,
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-live-chrome-select {
            display: none !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal {
            padding: 8px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-header {
            padding: 14px 14px 10px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-body {
            flex-direction: column !important;
            gap: 14px !important;
            padding: 0 14px 14px !important;
            overflow: auto;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-preview {
            min-height: 180px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-time-section,
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-footer {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-modal-footer {
            align-items: stretch !important;
            flex-direction: column !important;
          }
          [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-selection {
            font-size: 12px !important;
          }
        }
      `;
    };

    const updateView = () => {
      const messages = getMessages(currentLocale).runtime;
      const source = isPlaybackActive() ? currentProps.playbackUrl : currentProps.streamUrl;
      const normalizedSrc = normalizeSource(source);

      titleEl.style.display = currentProps.showTitle ? 'block' : 'none';
      titleEl.textContent = currentProps.title;
      liveTitleLabel.textContent = currentProps.title || (currentLocale?.startsWith('zh') ? '摄像头设备' : 'Camera');

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
      videoEl.style.objectFit = currentProps.objectFit;

      if (!normalizedSrc) {
        stopReadyPoll();
        currentSrc = '';
        videoEl.style.display = 'none';
        videoEl.removeAttribute('src');
        updatePlaceholder('empty');
        return;
      }

      videoEl.style.display = 'block';
      if (currentSrc !== normalizedSrc) {
        currentSrc = normalizedSrc;
        updatePlaceholder('loading');
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
