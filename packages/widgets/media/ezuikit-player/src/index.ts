import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLocaleRecord,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { buildEzopenUrl, playbackFingerprint } from './ezopen';

import zh from './locales/zh.json';
import en from './locales/en.json';

type RuntimeState = 'empty' | 'idle' | 'loading' | 'error';
type PlayerState = RuntimeState | 'ready';

type RuntimeMessages = {
  runtime: Record<RuntimeState, string>;
  playback?: {
    playback: string;
    live: string;
    title: string;
    start: string;
    end: string;
    cancel: string;
    play: string;
    invalidRange: string;
  };
};

const localeCatalog = { en, zh } as const;

function getMessages(locale: string | undefined): RuntimeMessages {
  return resolveLocaleRecord(localeCatalog, locale, 'zh') as RuntimeMessages;
}

type EzUIKitPlayerInstance = {
  destroy?: () => void;
  stop?: () => Promise<unknown>;
  play?: () => Promise<unknown>;
  changePlayUrl?: (options: Record<string, unknown>) => Promise<unknown>;
};

type EzUIKitModule = {
  EZUIKitPlayer: new (options: Record<string, unknown>) => EzUIKitPlayerInstance;
};

let ezuikitModulePromise: Promise<EzUIKitModule> | null = null;

function loadEzUIKitModule(): Promise<EzUIKitModule> {
  if (!ezuikitModulePromise) {
    ezuikitModulePromise = import('ezuikit-js').then((mod) => {
      const resolved = (mod as { default?: EzUIKitModule }).default ?? mod;
      return resolved as EzUIKitModule;
    });
  }
  return ezuikitModulePromise;
}

function resolveStaticPath(): string {
  if (typeof document === 'undefined') return '/ezuikit_static';
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[src]'),
  );
  const remoteEntry = scripts.find((script) =>
    script.src.includes('ezuikit-player/dist/remoteEntry.js'),
  );
  if (remoteEntry) {
    return remoteEntry.src.replace(/\/remoteEntry\.js(?:\?.*)?$/, '/ezuikit_static');
  }
  return '/widgets/media/ezuikit-player/dist/ezuikit_static';
}

function pad(input: number): string {
  return String(input).padStart(2, '0');
}

function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toEzvizTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function parseEzopenSource(url: string): { serial: string; channel: number } | null {
  const match = /ezopen:\/\/open\.ys7\.com\/([^/]+)\/(\d+)/i.exec(url);
  if (!match?.[1]) return null;
  return {
    serial: match[1],
    channel: Number(match[2] || 1) || 1,
  };
}

function resolveSource(props: Props): { serial: string; channel: number } | null {
  const serial = props.deviceSerial.trim();
  if (serial) return { serial, channel: props.channelNo || 1 };
  return parseEzopenSource(props.ezopenUrl.trim());
}

function buildCloudPlaybackUrl(props: Props, begin: string, end: string): string {
  const source = resolveSource(props);
  if (!source || !begin || !end) return '';
  return `ezopen://open.ys7.com/${source.serial}/${source.channel}.cloud.rec?${new URLSearchParams({
    begin,
    end,
  }).toString()}`;
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
    let state: PlayerState = 'empty';
    let player: EzUIKitPlayerInstance | null = null;
    let playerFingerprint = '';
    let mountGeneration = 0;
    let runtimePlaybackUrl = '';
    let resizeFrame: number | null = null;

    const playerHostId = `ezuikit-${Math.random().toString(36).slice(2, 10)}`;

    element.dataset.thingsvisOverlay = 'media-ezuikit-player';
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

    const shell = document.createElement('div');
    shell.style.cssText =
      'position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:#05070d;';
    element.appendChild(shell);

    const playerHost = document.createElement('div');
    playerHost.id = playerHostId;
    playerHost.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    shell.appendChild(playerHost);

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

    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      position:absolute;
      top:10px;
      right:10px;
      z-index:50;
      display:flex;
      gap:8px;
      pointer-events:auto;
    `;
    shell.appendChild(toolbar);

    const playbackButton = document.createElement('button');
    const liveButton = document.createElement('button');
    [playbackButton, liveButton].forEach((button) => {
      button.type = 'button';
      button.style.cssText = `
        border:1px solid rgba(255,255,255,0.28);
        border-radius:6px;
        padding:6px 10px;
        color:#fff;
        background:rgba(5,7,13,0.72);
        font-size:12px;
        line-height:1;
        cursor:pointer;
        backdrop-filter:blur(8px);
      `;
    });
    toolbar.append(playbackButton, liveButton);

    const modal = document.createElement('div');
    modal.style.cssText = `
      position:absolute;
      inset:0;
      z-index:60;
      display:none;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,0.48);
      padding:16px;
      box-sizing:border-box;
    `;
    shell.appendChild(modal);

    const panel = document.createElement('div');
    panel.style.cssText = `
      width:min(360px,100%);
      border-radius:8px;
      background:#fff;
      color:#111827;
      padding:16px;
      box-sizing:border-box;
      box-shadow:0 18px 48px rgba(0,0,0,0.32);
      font-size:13px;
    `;
    modal.appendChild(panel);

    const modalTitle = document.createElement('div');
    modalTitle.style.cssText = 'font-weight:600;font-size:15px;margin-bottom:12px;';
    const startLabel = document.createElement('label');
    const endLabel = document.createElement('label');
    const startInput = document.createElement('input');
    const endInput = document.createElement('input');
    const errorText = document.createElement('div');
    [startInput, endInput].forEach((input) => {
      input.type = 'datetime-local';
      input.style.cssText =
        'width:100%;height:34px;margin:6px 0 10px;border:1px solid #d1d5db;border-radius:6px;padding:0 8px;box-sizing:border-box;';
    });
    errorText.style.cssText = 'display:none;color:#dc2626;margin-bottom:10px;';
    const modalActions = document.createElement('div');
    modalActions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';
    const cancelButton = document.createElement('button');
    const playButton = document.createElement('button');
    [cancelButton, playButton].forEach((button) => {
      button.type = 'button';
      button.style.cssText =
        'border:0;border-radius:6px;padding:7px 12px;font-size:13px;cursor:pointer;';
    });
    cancelButton.style.background = '#e5e7eb';
    playButton.style.background = '#2563eb';
    playButton.style.color = '#fff';
    modalActions.append(cancelButton, playButton);
    panel.append(modalTitle, startLabel, startInput, endLabel, endInput, errorText, modalActions);

    const setState = (next: PlayerState, message?: string) => {
      state = next;
      const messages = getMessages(currentLocale).runtime;
      if (next === 'ready') {
        placeholder.style.display = 'none';
        return;
      }
      placeholder.style.display = 'flex';
      placeholderText.textContent = message ?? messages[next] ?? messages.empty;
    };

    const destroyPlayer = () => {
      try {
        player?.stop?.();
      } catch {
        // ignore stop errors during teardown
      }
      try {
        player?.destroy?.();
      } catch {
        // ignore destroy errors during teardown
      }
      player = null;
      playerFingerprint = '';
      playerHost.innerHTML = '';
    };

    const getHostSize = () => {
      const rect = playerHost.getBoundingClientRect();
      const width = Math.floor(
        rect.width || playerHost.clientWidth || shell.clientWidth || element.clientWidth || 0,
      );
      const height = Math.floor(
        rect.height || playerHost.clientHeight || shell.clientHeight || element.clientHeight || 0,
      );
      return {
        width: Math.max(width, 320),
        height: Math.max(height, 240),
      };
    };

    const getPlayerUrl = () => runtimePlaybackUrl || buildEzopenUrl(currentProps);

    const createPlayer = async () => {
      const generation = ++mountGeneration;
      const token = currentProps.accessToken.trim();
      const url = getPlayerUrl();
      const fingerprint = playbackFingerprint(currentProps);
      const { width, height } = getHostSize();
      const effectiveFingerprint = `${fingerprint}|${runtimePlaybackUrl}|${width}x${height}`;

      if (!token || !url) {
        destroyPlayer();
        setState('empty');
        return;
      }

      if (currentMode === 'edit') {
        destroyPlayer();
        setState('idle');
        return;
      }

      if (player && playerFingerprint === effectiveFingerprint) {
        setState('ready');
        return;
      }

      destroyPlayer();
      setState('loading');
      playerFingerprint = effectiveFingerprint;

      try {
        const EZUIKit = await loadEzUIKitModule();
        if (generation !== mountGeneration) return;

        const options: Record<string, unknown> = {
          id: playerHostId,
          accessToken: token,
          url,
          template: currentProps.template,
          plugin: currentProps.audio ? ['talk'] : [],
          width,
          height,
          autoplay: currentProps.autoplay,
          audio: currentProps.audio,
          scaleMode: 1,
          env: {
            domain: currentProps.domain.trim() || 'https://open.ys7.com',
          },
          staticPath: resolveStaticPath(),
          handleError: () => setState('error'),
        };

        if (currentProps.validCode.trim()) {
          options.validCode = currentProps.validCode.trim();
        }
        if (currentProps.themeId.trim() && currentProps.template === 'theme') {
          options.themeId = currentProps.themeId.trim();
        }

        player = new EZUIKit.EZUIKitPlayer(options);
        setState('ready');
      } catch {
        destroyPlayer();
        setState('error');
      }
    };

    const openPlaybackModal = () => {
      const messages = getMessages(currentLocale).playback;
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startInput.value = toLocalInputValue(start);
      endInput.value = toLocalInputValue(now);
      errorText.style.display = 'none';
      modalTitle.textContent = messages?.title ?? 'Playback';
      modal.style.display = 'flex';
    };

    const closePlaybackModal = () => {
      modal.style.display = 'none';
    };

    const requestPlayback = () => {
      const messages = getMessages(currentLocale).playback;
      const begin = toEzvizTime(startInput.value);
      const end = toEzvizTime(endInput.value);
      if (!begin || !end || begin >= end) {
        errorText.textContent = messages?.invalidRange ?? 'Please select a valid time range';
        errorText.style.display = 'block';
        return;
      }
      const nextUrl = buildCloudPlaybackUrl(currentProps, begin, end);
      if (!nextUrl) {
        errorText.textContent = messages?.invalidRange ?? 'Please select a valid time range';
        errorText.style.display = 'block';
        return;
      }
      runtimePlaybackUrl = nextUrl;
      closePlaybackModal();
      updateView();
    };

    const returnToLive = () => {
      runtimePlaybackUrl = '';
      updateView();
    };

    playbackButton.addEventListener('click', openPlaybackModal);
    liveButton.addEventListener('click', returnToLive);
    cancelButton.addEventListener('click', closePlaybackModal);
    playButton.addEventListener('click', requestPlayback);

    const syncPlaybackControls = () => {
      const messages = getMessages(currentLocale).playback;
      const showPlaybackControls = currentProps.showPlaybackControls !== false;
      toolbar.style.display =
        currentMode !== 'edit' && showPlaybackControls ? 'flex' : 'none';
      playbackButton.textContent = messages?.playback ?? 'Playback';
      liveButton.textContent = messages?.live ?? 'Live';
      liveButton.style.display = runtimePlaybackUrl ? 'inline-flex' : 'none';
      startLabel.textContent = messages?.start ?? 'Start';
      endLabel.textContent = messages?.end ?? 'End';
      cancelButton.textContent = messages?.cancel ?? 'Cancel';
      playButton.textContent = messages?.play ?? 'Play';
    };

    const updateView = () => {
      shell.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius =
        currentProps.borderRadius === 0 ? '0' : `${currentProps.borderRadius}px`;
      shell.style.boxSizing = 'border-box';

      syncPlaybackControls();
      void createPlayer();
    };

    const scheduleResizeRefresh = () => {
      if (resizeFrame !== null || currentMode === 'edit') return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        void createPlayer();
      });
    };

    const resizeObserver =
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? new window.ResizeObserver(scheduleResizeRefresh)
        : null;
    resizeObserver?.observe(shell);

    updateView();

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentCtx = newCtx;
        currentLocale = newCtx.locale;
        currentMode = newCtx.mode ?? currentMode;
        if (runtimePlaybackUrl && !resolveSource(newProps)) {
          runtimePlaybackUrl = '';
        }
        updateView();
      },
      destroy: () => {
        mountGeneration += 1;
        resizeObserver?.disconnect();
        if (resizeFrame !== null) {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = null;
        }
        destroyPlayer();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
