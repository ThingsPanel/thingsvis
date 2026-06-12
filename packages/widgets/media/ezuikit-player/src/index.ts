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

    const getHostSize = () => ({
      width: Math.max(playerHost.clientWidth, 320),
      height: Math.max(playerHost.clientHeight, 240),
    });

    const createPlayer = async () => {
      const generation = ++mountGeneration;
      const token = currentProps.accessToken.trim();
      const url = buildEzopenUrl(currentProps);
      const fingerprint = playbackFingerprint(currentProps);

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

      if (player && playerFingerprint === fingerprint) {
        setState('ready');
        return;
      }

      destroyPlayer();
      setState('loading');
      playerFingerprint = fingerprint;

      try {
        const EZUIKit = await loadEzUIKitModule();
        if (generation !== mountGeneration) return;

        const { width, height } = getHostSize();
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

    const updateView = () => {
      shell.style.border = `${currentProps.borderWidth}px solid ${currentProps.borderColor}`;
      shell.style.borderRadius =
        currentProps.borderRadius === 0 ? '0' : `${currentProps.borderRadius}px`;
      shell.style.boxSizing = 'border-box';

      void createPlayer();
    };

    updateView();

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        currentProps = newProps;
        currentCtx = newCtx;
        currentLocale = newCtx.locale;
        currentMode = newCtx.mode ?? currentMode;
        updateView();
      },
      destroy: () => {
        mountGeneration += 1;
        destroyPlayer();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
