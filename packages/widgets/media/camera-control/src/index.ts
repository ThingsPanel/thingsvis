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
import {
  buildPlaybackIso,
  mountPlaybackCalendar,
  parsePlaybackRange,
  type PlaybackCalendarMount,
} from './playback-calendar';

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

const PLAYBACK_SPEEDS = [1, 2, 4] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatMediaTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
  return `${pad2(minutes)}:${pad2(secs)}`;
}

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
      background: transparent;
    `;

    const styleEl = document.createElement('style');
    element.appendChild(styleEl);

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'flex:0 0 auto;font-size:15px;font-weight:600;margin-bottom:6px;';
    element.appendChild(titleEl);

    const shell = document.createElement('div');
    shell.style.cssText =
      'position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:#05070d;';
    element.appendChild(shell);

    const toolbar = document.createElement('div');
    toolbar.className = 'tv-camera-toolbar';
    toolbar.style.cssText = `
      position:absolute;
      top:8px;
      right:8px;
      z-index:4;
      display:none;
      align-items:center;
      justify-content:flex-end;
      flex-wrap:wrap;
      gap:6px;
      padding:0;
      box-sizing:border-box;
      background:transparent;
      max-width:52%;
    `;
    shell.appendChild(toolbar);

    const videoEl: any = document.createElement('video-rtc');
    videoEl.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1;';
    shell.appendChild(videoEl);

    const placeholder = document.createElement('div');
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
      background:rgba(5,7,13,0.72);
      text-align:center;
      font-size:13px;
    `;
    const placeholderText = document.createElement('div');
    placeholder.appendChild(placeholderText);
    shell.appendChild(placeholder);

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
      position:absolute;
      top:8px;
      left:8px;
      right:auto;
      z-index:3;
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:8px;
      max-width:calc(48% - 12px);
      pointer-events:none;
    `;
    shell.appendChild(statusBar);

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
      'display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;min-width:0;';
    toolbar.appendChild(actionPanel);

    const playbackPanel = document.createElement('div');
    playbackPanel.className = 'tv-camera-playback-panel';
    playbackPanel.style.cssText = `
      position:absolute;
      left:8px;
      right:8px;
      bottom:8px;
      z-index:5;
      display:none;
      flex-direction:column;
      gap:8px;
      padding:10px;
      box-sizing:border-box;
      border-radius:10px;
      background:rgba(0,0,0,0.78);
      border:1px solid rgba(255,255,255,0.12);
      pointer-events:auto;
    `;
    shell.appendChild(playbackPanel);

    const playbackFields = document.createElement('div');
    playbackFields.className = 'tv-camera-playback-fields';
    playbackFields.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:0;';
    playbackPanel.appendChild(playbackFields);

    const playbackHint = document.createElement('div');
    playbackHint.className = 'tv-camera-playback-hint';
    playbackHint.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.55);line-height:16px;';
    playbackPanel.appendChild(playbackHint);

    const playbackActions = document.createElement('div');
    playbackActions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;';
    playbackPanel.appendChild(playbackActions);

    const transportBar = document.createElement('div');
    transportBar.className = 'tv-camera-transport-bar';
    transportBar.style.cssText = `
      position:absolute;
      left:8px;
      right:8px;
      bottom:8px;
      z-index:5;
      display:none;
      align-items:center;
      gap:8px;
      padding:8px 10px;
      box-sizing:border-box;
      border-radius:10px;
      background:rgba(0,0,0,0.78);
      border:1px solid rgba(255,255,255,0.12);
      pointer-events:auto;
    `;
    shell.appendChild(transportBar);

    const transportPlayButton = makeButton('▶', 'Play', 'tv-camera-action-button');
    transportPlayButton.style.minWidth = '36px';
    transportPlayButton.style.maxWidth = '36px';
    transportPlayButton.style.padding = '0';

    const transportRange = document.createElement('input');
    transportRange.type = 'range';
    transportRange.className = 'tv-camera-transport-range';
    transportRange.min = '0';
    transportRange.max = '1000';
    transportRange.value = '0';
    transportRange.style.cssText = 'flex:1 1 0;min-width:0;height:4px;margin:0;';

    const transportTime = document.createElement('span');
    transportTime.className = 'tv-camera-transport-time';
    transportTime.style.cssText =
      'flex:0 0 auto;font-size:11px;color:rgba(255,255,255,0.85);font-variant-numeric:tabular-nums;white-space:nowrap;';

    const transportSpeedButton = makeButton('1x', 'Speed', 'tv-camera-action-button');
    transportSpeedButton.style.minWidth = '44px';
    transportSpeedButton.style.maxWidth = '44px';
    transportSpeedButton.style.padding = '0';

    transportBar.append(
      transportPlayButton,
      transportRange,
      transportTime,
      transportSpeedButton,
    );

    const stopTransportTimer = () => {
      if (transportTimer) {
        clearInterval(transportTimer);
        transportTimer = null;
      }
    };

    transportPlayButton.addEventListener('click', () => {
      if (!internalVideo) return;
      if (internalVideo.paused) {
        void internalVideo.play();
      } else {
        internalVideo.pause();
      }
      updateTransport();
    });

    transportRange.addEventListener('pointerdown', () => {
      scrubbingTransport = true;
    });
    transportRange.addEventListener('pointerup', () => {
      scrubbingTransport = false;
    });
    transportRange.addEventListener('pointercancel', () => {
      scrubbingTransport = false;
    });
    transportRange.addEventListener('input', () => {
      if (!internalVideo) return;
      const duration = internalVideo.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      internalVideo.currentTime = (Number(transportRange.value) / 1000) * duration;
      updateTransport();
    });

    transportSpeedButton.addEventListener('click', () => {
      playbackSpeedIndex = (playbackSpeedIndex + 1) % PLAYBACK_SPEEDS.length;
      if (internalVideo) {
        internalVideo.playbackRate = PLAYBACK_SPEEDS[playbackSpeedIndex] ?? 1;
      }
      updateTransport();
    });

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

    const playbackCalendar: PlaybackCalendarMount = mountPlaybackCalendar(playbackFields, {
      locale: currentLocale,
      labels: getCalendarLabels(),
      onChange: () => {},
    });

    const syncPlaybackInputs = () => {
      playbackCalendar.setRange(
        parsePlaybackRange(currentProps.playbackStart, currentProps.playbackEnd),
      );
      playbackHint.textContent = getMessages(currentLocale).calendar.hint;
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
      stopTransportTimer();
      if (internalVideo) {
        internalVideo.playbackRate = 1;
      }
      updateView();
    };

    const requestPlayback = () => {
      const iso = buildPlaybackIso(playbackCalendar.getRange());
      if (!iso) return;
      runtimeStreamMode = 'playback';
      playbackPanelOpen = false;
      emitCommand('playbackRequest', currentProps.playbackOpenCommand, iso);
      updateView();
    };

    const updateTransport = () => {
      if (!internalVideo || !isPlaybackActive() || currentMode === 'edit') {
        transportBar.style.display = 'none';
        return;
      }
      const messages = getMessages(currentLocale).buttons;
      transportBar.style.display = state === 'ready' ? 'flex' : 'none';
      playbackPanel.style.display =
        !isPlaybackActive() && playbackPanelOpen && currentProps.showPlaybackControls
          ? 'flex'
          : 'none';
      if (state !== 'ready') return;

      const duration = internalVideo.duration;
      const current = internalVideo.currentTime;
      const hasDuration = Number.isFinite(duration) && duration > 0;
      if (!scrubbingTransport && hasDuration) {
        transportRange.value = String(Math.round((current / duration) * 1000));
      } else if (!scrubbingTransport) {
        transportRange.value = '0';
      }
      transportRange.disabled = !hasDuration;
      const speed = PLAYBACK_SPEEDS[playbackSpeedIndex] ?? 1;
      transportSpeedButton.textContent = `${speed}x`;
      transportSpeedButton.title = messages.speed ?? 'Speed';
      transportPlayButton.textContent = internalVideo.paused ? '▶' : '⏸';
      transportPlayButton.title = internalVideo.paused
        ? (messages.play ?? 'Play')
        : (messages.pause ?? 'Pause');
      transportTime.textContent = hasDuration
        ? `${formatMediaTime(current)} / ${formatMediaTime(duration)}`
        : formatMediaTime(current);
    };

    const renderPlaybackPanel = () => {
      const messages = getMessages(currentLocale).buttons;
      const show = currentMode !== 'edit' && currentProps.showPlaybackControls && playbackPanelOpen;
      playbackPanel.style.display = show ? 'flex' : 'none';
      playbackHint.style.display = show ? 'block' : 'none';
      if (!show) return;

      playbackHint.textContent = getMessages(currentLocale).calendar.hint;
      playbackCalendar.setRange(
        parsePlaybackRange(currentProps.playbackStart, currentProps.playbackEnd),
      );

      playbackActions.innerHTML = '';
      const playButton = makeButton(
        messages.playbackPlay ?? 'Play',
        messages.playbackPlay ?? 'Play',
        'tv-camera-action-button',
      );
      playButton.addEventListener('click', requestPlayback);
      const cancelButton = makeButton(
        messages.playbackCancel ?? 'Cancel',
        messages.playbackCancel ?? 'Cancel',
        'tv-camera-action-button',
      );
      cancelButton.addEventListener('click', () => {
        playbackPanelOpen = false;
        renderPlaybackPanel();
        updateTransport();
      });
      playbackActions.append(playButton, cancelButton);
    };

    const startTransportTimer = () => {
      stopTransportTimer();
      if (!isPlaybackActive() || currentMode === 'edit') return;
      transportTimer = setInterval(updateTransport, 250);
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
        updateTransport();
      });
      internalVideo.addEventListener('canplay', () => {
        updatePlaceholder('ready');
        updateTransport();
      });
      internalVideo.addEventListener('playing', () => {
        updatePlaceholder('ready');
        updateTransport();
      });
      internalVideo.addEventListener('pause', updateTransport);
      internalVideo.addEventListener('timeupdate', updateTransport);
      internalVideo.addEventListener('durationchange', updateTransport);
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

    const toggleFullscreen = () => {
      if (isShellFullscreen()) {
        void document.exitFullscreen?.();
        return;
      }
      void shell.requestFullscreen?.();
    };

    const handleFullscreenChange = () => {
      renderControls();
    };

    const renderStatusBar = () => {
      const messages = getMessages(currentLocale).runtime;
      statusBar.innerHTML = '';
      if (!currentProps.showStatusBar) return;

      const streamMode = isPlaybackActive() ? messages.playback : messages.live;
      const online = statusToBool(currentProps.onlineStatus);
      const recording = statusToBool(currentProps.recordingStatus);
      const items = [
        streamMode,
        online === undefined ? '' : online ? messages.online : messages.offline,
        recording === undefined ? '' : recording ? messages.recording : messages.idleRecord,
      ].filter(Boolean);

      items.forEach((item) => {
        const chip = document.createElement('span');
        chip.textContent = item;
        chip.style.cssText = `
          padding:3px 8px;
          border-radius:999px;
          color:#fff;
          background:rgba(0,0,0,${currentProps.panelOpacity});
          font-size:12px;
          line-height:18px;
        `;
        statusBar.appendChild(chip);
      });
    };

    const renderControls = () => {
      const messages = getMessages(currentLocale).buttons;
      const isPlayback = isPlaybackActive();
      ptzPanel.innerHTML = '';
      actionPanel.innerHTML = '';
      const showToolbar = currentMode !== 'edit';
      const showPtzPad = false;
      toolbar.style.display = showToolbar ? 'flex' : 'none';
      ptzPanel.style.display = showPtzPad && !isPlayback ? 'grid' : 'none';
      renderPlaybackPanel();
      updateTransport();
      if (currentMode === 'edit') {
        playbackPanel.style.display = 'none';
        transportBar.style.display = 'none';
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

      if (internalVideo) {
        addAction(
          internalVideo.muted ? '🔇' : '🔊',
          internalVideo.muted ? buttonTitle('unmute', 'Unmute') : buttonTitle('mute', 'Mute'),
          () => {
            if (!internalVideo) return;
            internalVideo.muted = !internalVideo.muted;
            renderControls();
          },
        );
      }

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
        addAction(buttonTitle('snapshot', 'Snapshot'), buttonTitle('snapshot', 'Snapshot'), () =>
          emitCommand('snapshot', currentProps.snapshotCommand, {}),
        );
      }

      if (currentProps.showFullscreen) {
        const fullscreenLabel = isShellFullscreen()
          ? buttonTitle('exitFullscreen', currentLocale?.startsWith('zh') ? '退出全屏' : 'Exit fullscreen')
          : buttonTitle('fullscreen', 'Fullscreen');
        addAction(fullscreenLabel, fullscreenLabel, toggleFullscreen);
      }

      if (isPlayback) {
        addAction(
          buttonTitle('returnToLive', 'Return to live'),
          buttonTitle('returnToLive', 'Return to live'),
          returnToLive,
        );
      } else if (currentProps.showPlaybackControls) {
        addAction(buttonTitle('playback', 'Playback'), buttonTitle('playback', 'Playback'), () => {
          syncPlaybackInputs();
          playbackPanelOpen = true;
          renderPlaybackPanel();
          updateTransport();
        });
      }
    };

    const updateStyles = () => {
      titleEl.style.color = colors.fg;
      const panelBottom = isPlaybackActive() && currentMode !== 'edit' ? '56px' : '8px';
      playbackPanel.style.bottom = panelBottom;
      transportBar.style.bottom = '8px';
      shell.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius =
        currentProps.borderRadius === 0 ? '0' : `${currentProps.borderRadius}px`;
      shell.style.boxSizing = 'border-box';
      styleEl.textContent = `
        [data-thingsvis-overlay="media-camera-control"] video-rtc video {
          object-fit: ${currentProps.objectFit} !important;
        }
        [data-thingsvis-overlay="media-camera-control"] video-rtc video::-webkit-media-controls {
          display: none !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-toolbar,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-playback-panel,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-transport-bar {
          opacity: ${currentProps.panelOpacity};
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          height: 36px;
          min-width: 36px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          color: #fff;
          background: rgba(0,0,0,0.58);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          box-sizing: border-box;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button {
          width: auto;
          max-width: 112px;
          padding: 0 10px;
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
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          color: #fff;
          background: rgba(0,0,0,0.58);
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-nav:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.28);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-calendar-day:hover {
          border-color: rgba(64, 158, 255, 0.55) !important;
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-transport-range {
          accent-color: rgba(64, 158, 255, 0.9);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:hover,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.28);
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-control-button:active,
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-action-button:active {
          background: rgba(64, 158, 255, 0.28);
          border-color: rgba(64, 158, 255, 0.55);
        }
      `;
    };

    const updateView = () => {
      const messages = getMessages(currentLocale).runtime;
      const source = isPlaybackActive() ? currentProps.playbackUrl : currentProps.streamUrl;
      const normalizedSrc = normalizeSource(source);

      titleEl.style.display = currentProps.showTitle ? 'block' : 'none';
      titleEl.textContent = currentProps.title;

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
        playbackCalendar.updateLabels(getCalendarLabels(), currentLocale);
        playbackCalendar.setRange(
          parsePlaybackRange(currentProps.playbackStart, currentProps.playbackEnd),
        );
        playbackHint.textContent = getMessages(currentLocale).calendar.hint;
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
        playbackCalendar.destroy();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
