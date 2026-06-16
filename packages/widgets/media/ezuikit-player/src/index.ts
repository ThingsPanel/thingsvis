import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLocaleRecord,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import {
  buildCloudRecEzopenUrl,
  buildLiveEzopenUrl,
  getTodayBeginTimestamp,
  isPlayerConfigured,
  playbackFingerprint,
  resolveCloudRecPlaybackParams,
  resolveDeviceSource,
  resolveSpaceId,
  type EzopenSource,
} from './ezopen';

import zh from './locales/zh.json';
import en from './locales/en.json';

type RuntimeState = 'empty' | 'idle' | 'loading' | 'error';
type PlayerState = RuntimeState | 'ready';
type StreamMode = 'live' | 'playback';

type RuntimeMessages = {
  runtime: Record<RuntimeState, string>;
  playback?: {
    playback: string;
    live: string;
  };
};

const localeCatalog = { en, zh } as const;
const MIN_SWITCH_INTERVAL_MS = 1000;
const PLAYBACK_THEME = 'pcRec';

function getMessages(locale: string | undefined): RuntimeMessages {
  return resolveLocaleRecord(localeCatalog, locale, 'zh') as RuntimeMessages;
}

type EzUIKitPlayerInstance = {
  destroy?: () => void;
  stop?: () => Promise<unknown>;
  play?: () => Promise<unknown>;
  changePlayUrl?: (options: Record<string, unknown>) => Promise<unknown>;
  changeTheme?: (template: string) => void;
  resize?: (width: number | string, height: number | string) => void;
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

function resolveLiveTheme(props: Props): string {
  const template = props.template.trim();
  if (template === 'pcLive' || template === 'mobileLive' || template === 'security') {
    return template;
  }
  return 'security';
}

function buildLiveChangePlayOptions(source: EzopenSource, props: Props): Record<string, unknown> {
  const options: Record<string, unknown> = {
    type: 'live',
    deviceSerial: source.serial,
    channelNo: source.channel,
    accessToken: props.accessToken.trim(),
    hd: source.hd,
  };
  if (props.validCode.trim()) {
    options.validCode = props.validCode.trim();
  }
  return options;
}

function buildCloudRecChangePlayOptions(
  source: EzopenSource,
  props: Props,
  begin?: string,
): Record<string, unknown> {
  const rec = resolveCloudRecPlaybackParams(props, begin);
  const options: Record<string, unknown> = {
    url: buildCloudRecEzopenUrl(source, rec),
    accessToken: props.accessToken.trim(),
  };
  if (props.validCode.trim()) {
    options.validCode = props.validCode.trim();
  }
  return options;
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
    let currentLocale = ctx.locale;
    let currentMode = ctx.mode ?? 'edit';
    let player: EzUIKitPlayerInstance | null = null;
    let playerFingerprint = '';
    let mountGeneration = 0;
    let resizeFrame: number | null = null;
    let streamMode: StreamMode = 'live';
    let switchInFlight = false;
    let lastSwitchAt = 0;

    const playerHostId = `ezuikit-${Math.random().toString(36).slice(2, 10)}`;
    const layoutStyleId = `ezuikit-style-${playerHostId}`;

    element.dataset.thingsvisOverlay = 'media-ezuikit-player';
    element.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
      font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
      background: transparent;
    `;

    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      position:absolute;
      top:10px;
      right:10px;
      z-index:2147483000;
      display:none;
      gap:8px;
      pointer-events:auto;
    `;

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
        pointer-events:auto;
      `;
    });
    toolbar.append(playbackButton, liveButton);

    const shell = document.createElement('div');
    shell.style.cssText =
      'position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:#05070d;width:100%;height:100%;';

    element.appendChild(shell);
    element.appendChild(toolbar);

    const ensureLayoutStyle = () => {
      let layoutStyle = document.getElementById(layoutStyleId) as HTMLStyleElement | null;
      if (!layoutStyle) {
        layoutStyle = document.createElement('style');
        layoutStyle.id = layoutStyleId;
        document.head.appendChild(layoutStyle);
      }
      return layoutStyle;
    };

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

    const setState = (next: PlayerState, message?: string) => {
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

    const syncLayoutStyles = () => {
      const layoutStyle = ensureLayoutStyle();
      layoutStyle.textContent = `
        [data-thingsvis-overlay="media-ezuikit-player"] #${playerHostId} {
          width: 100% !important;
          height: 100% !important;
        }
      `;
    };

    const refreshPlayerLayout = () => {
      if (!player?.resize) return;
      player.resize('100%', '100%');
    };

    const waitForLayout = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

    const applyTheme = (mode: StreamMode) => {
      const theme = mode === 'live' ? resolveLiveTheme(currentProps) : PLAYBACK_THEME;
      player?.changeTheme?.(theme);
    };

    const switchStreamMode = async (nextMode: StreamMode, begin?: string) => {
      const now = Date.now();
      if (switchInFlight || now - lastSwitchAt < MIN_SWITCH_INTERVAL_MS) {
        return;
      }

      const source = resolveDeviceSource(currentProps);
      if (!source) {
        setState('empty');
        return;
      }

      if (!player?.changePlayUrl) {
        streamMode = nextMode;
        void createPlayer();
        return;
      }

      switchInFlight = true;
      liveButton.disabled = true;
      playbackButton.disabled = true;
      try {
        const options =
          nextMode === 'live'
            ? buildLiveChangePlayOptions(source, currentProps)
            : buildCloudRecChangePlayOptions(
                source,
                currentProps,
                begin ?? getTodayBeginTimestamp(),
              );
        await player.changePlayUrl(options);
        applyTheme(nextMode);
        streamMode = nextMode;
        lastSwitchAt = Date.now();
        setState('ready');
      } catch {
        setState('error');
      } finally {
        switchInFlight = false;
        syncPlaybackControls();
      }
    };

    const createPlayer = async () => {
      const generation = ++mountGeneration;
      await waitForLayout();
      if (generation !== mountGeneration) return;

      const source = resolveDeviceSource(currentProps);
      const token = currentProps.accessToken.trim();
      const url = source ? buildLiveEzopenUrl(source) : '';
      const effectiveFingerprint = playbackFingerprint(currentProps);

      if (!isPlayerConfigured(currentProps) || !url) {
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
      streamMode = 'live';

      try {
        const EZUIKit = await loadEzUIKitModule();
        if (generation !== mountGeneration) return;

        const options: Record<string, unknown> = {
          id: playerHostId,
          accessToken: token,
          url,
          template: resolveLiveTheme(currentProps),
          plugin: currentProps.audio ? ['talk'] : [],
          width: '100%',
          height: '100%',
          autoplay: currentProps.autoplay,
          audio: currentProps.audio,
          scaleMode: 2,
          env: {
            domain: currentProps.domain.trim() || 'https://open.ys7.com',
          },
          staticPath: resolveStaticPath(),
          handleError: () => setState('error'),
        };

        if (currentProps.validCode.trim()) {
          options.validCode = currentProps.validCode.trim();
        }
        const spaceId = resolveSpaceId(currentProps);
        if (spaceId) {
          options.spaceId = spaceId;
        }
        if (currentProps.themeId.trim() && currentProps.template === 'theme') {
          options.themeId = currentProps.themeId.trim();
        }

        player = new EZUIKit.EZUIKitPlayer(options);
        syncLayoutStyles();
        setState('ready');
        syncPlaybackControls();
      } catch {
        destroyPlayer();
        setState('error');
      }
    };

    const setModeButtonStyle = (button: HTMLButtonElement, active: boolean) => {
      button.style.borderColor = active ? '#60a5fa' : 'rgba(255,255,255,0.28)';
      button.style.background = active ? 'rgba(37,99,235,0.88)' : 'rgba(5,7,13,0.72)';
      button.style.opacity = active ? '1' : '0.92';
    };

    const requestPlayback = () => {
      void switchStreamMode('playback');
    };

    const requestLive = () => {
      void switchStreamMode('live');
    };

    playbackButton.addEventListener('click', requestPlayback);
    liveButton.addEventListener('click', requestLive);

    const syncPlaybackControls = () => {
      const messages = getMessages(currentLocale).playback;
      const showToolbar = currentMode !== 'edit';
      toolbar.style.display = showToolbar ? 'flex' : 'none';

      playbackButton.textContent = messages?.playback ?? 'Playback';
      liveButton.textContent = messages?.live ?? 'Live';
      playbackButton.disabled = switchInFlight;
      liveButton.disabled = switchInFlight;
      setModeButtonStyle(liveButton, streamMode === 'live');
      setModeButtonStyle(playbackButton, streamMode === 'playback');
    };

    const updateView = () => {
      shell.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius =
        currentProps.borderRadius === 0 ? '0' : `${currentProps.borderRadius}px`;
      shell.style.boxSizing = 'border-box';
      syncPlaybackControls();
      syncLayoutStyles();

      if (!isPlayerConfigured(currentProps)) {
        destroyPlayer();
        setState('empty');
        return;
      }
      if (currentMode === 'edit') {
        destroyPlayer();
        setState('idle');
        return;
      }
      void createPlayer();
    };

    const scheduleResizeRefresh = () => {
      if (resizeFrame !== null || currentMode === 'edit') return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        refreshPlayerLayout();
      });
    };

    const resizeObserver =
      typeof window !== 'undefined' && 'ResizeObserver' in window
        ? new window.ResizeObserver(scheduleResizeRefresh)
        : null;
    resizeObserver?.observe(element);
    resizeObserver?.observe(shell);

    syncLayoutStyles();
    updateView();

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentLocale = newCtx.locale;
        currentMode = newCtx.mode ?? currentMode;
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
        document.getElementById(layoutStyleId)?.remove();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
