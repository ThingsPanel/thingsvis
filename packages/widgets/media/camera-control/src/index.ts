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

    const syncVideoTransport = () => {
      if (!internalVideo) return;
      const isPlayback = currentProps.mode === 'playback';
      internalVideo.controls = isPlayback;
      if (isPlayback) {
        internalVideo.muted = false;
      }
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
      internalVideo.addEventListener('loadeddata', () => updatePlaceholder('ready'));
      internalVideo.addEventListener('canplay', () => updatePlaceholder('ready'));
      internalVideo.addEventListener('playing', () => updatePlaceholder('ready'));
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

    const renderStatusBar = () => {
      const messages = getMessages(currentLocale).runtime;
      statusBar.innerHTML = '';
      if (!currentProps.showStatusBar) return;

      const streamMode = currentProps.mode === 'playback' ? messages.playback : messages.live;
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
      const isPlayback = currentProps.mode === 'playback';
      ptzPanel.innerHTML = '';
      actionPanel.innerHTML = '';
      const showToolbar = currentMode !== 'edit';
      toolbar.style.display = showToolbar ? 'flex' : 'none';
      ptzPanel.style.display = currentProps.showPtz && !isPlayback ? 'grid' : 'none';
      if (currentMode === 'edit') return;

      if (currentProps.showPtz) {
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
        addAction(buttonTitle('fullscreen', 'Fullscreen'), buttonTitle('fullscreen', 'Fullscreen'), () => {
          void shell.requestFullscreen?.();
        });
      }

      if (currentProps.showPlaybackControls) {
        addAction(buttonTitle('playbackRequest', 'Request playback'), buttonTitle('playbackRequest', 'Request playback'), () =>
          emitCommand('playbackRequest', currentProps.playbackOpenCommand, {
            start: currentProps.playbackStart,
            end: currentProps.playbackEnd,
          }),
        );
      }
    };

    const updateStyles = () => {
      titleEl.style.color = colors.fg;
      const isPlayback = currentProps.mode === 'playback';
      shell.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius =
        currentProps.borderRadius === 0 ? '0' : `${currentProps.borderRadius}px`;
      shell.style.boxSizing = 'border-box';
      const hideNativeControls = !isPlayback;
      styleEl.textContent = `
        [data-thingsvis-overlay="media-camera-control"] video-rtc video {
          object-fit: ${currentProps.objectFit} !important;
        }
        ${
          hideNativeControls
            ? `[data-thingsvis-overlay="media-camera-control"] video-rtc video::-webkit-media-controls {
          display: none !important;
        }`
            : ''
        }
        [data-thingsvis-overlay="media-camera-control"] .tv-camera-toolbar {
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
      const source =
        currentProps.mode === 'playback' ? currentProps.playbackUrl : currentProps.streamUrl;
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
    };

    bindInternalVideo();
    updateView();

    window.addEventListener('blur', sendStop);

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentCtx = newCtx;
        currentLocale = newCtx.locale;
        currentMode = newCtx.mode ?? currentMode;
        colors = resolveWidgetColors(element);
        updateView();
      },
      destroy: () => {
        sendStop();
        window.removeEventListener('blur', sendStop);
        if (attachVideoRaf) cancelAnimationFrame(attachVideoRaf);
        stopReadyPoll();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
