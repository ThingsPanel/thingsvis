import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WidgetMainModule } from '@thingsvis/widget-sdk';
import { mountWidget } from './widgetLifecycle';

const echartsSetOption = vi.fn();
const echartsResize = vi.fn();
const echartsDispose = vi.fn();
const echartsIsDisposed = vi.fn(() => false);

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: echartsSetOption,
    resize: echartsResize,
    dispose: echartsDispose,
    isDisposed: echartsIsDisposed,
  })),
  graphic: {
    LinearGradient: class LinearGradient {
      constructor(...args: unknown[]) {
        Object.assign(this, { args });
      }
    },
  },
}));

const uPlotSetSize = vi.fn();
const uPlotDestroy = vi.fn();

class UPlotMock {
  static paths = {
    spline: () => undefined,
  };

  root: HTMLDivElement;

  constructor(_opts: unknown, _data: unknown, target: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'uplot';
    target.appendChild(this.root);
  }

  setSize(size: unknown) {
    uPlotSetSize(size);
  }

  destroy() {
    uPlotDestroy();
    this.root.remove();
  }
}

vi.mock('uplot', () => ({
  default: UPlotMock,
}));

vi.mock('uplot/dist/uPlot.min.css', () => ({}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MutationObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class WebSocketMock {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = WebSocketMock.CLOSED;

  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

class RTCPeerConnectionMock {
  addEventListener() {}
  removeEventListener() {}
  addTransceiver() {}
  addTrack() {}
  close() {}
  createOffer = async () => ({ type: 'offer', sdp: '' });
  createAnswer = async () => ({ type: 'answer', sdp: '' });
  setLocalDescription = async () => {};
  setRemoteDescription = async () => {};
  addIceCandidate = async () => {};
  getReceivers() {
    return [];
  }
  getSenders() {
    return [];
  }
  getTransceivers() {
    return [];
  }
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('MutationObserver', MutationObserverMock);
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
vi.stubGlobal('WebSocket', WebSocketMock);
vi.stubGlobal('RTCPeerConnection', RTCPeerConnectionMock);
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return window.setTimeout(() => cb(0), 0);
});
vi.stubGlobal('cancelAnimationFrame', (id: number) => {
  window.clearTimeout(id);
});
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent() {
    return false;
  },
}));

if (typeof HTMLMediaElement !== 'undefined') {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
    configurable: true,
    get() {
      return 2;
    },
  });
}

const widgetModuleLoaders = import.meta.glob<{ default?: WidgetMainModule; Main?: WidgetMainModule }>(
  '../*/*/src/index.{ts,tsx}',
);

const widgetModulePaths = Object.keys(widgetModuleLoaders).sort();
const runtimeContractModulePaths = widgetModulePaths.filter(
  (modulePath) => !modulePath.includes('../chart/') && !modulePath.includes('../media/video-player/'),
);

describe('widget runtime contracts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.querySelector('#__tv-switch-spinner-css')?.remove();
    echartsSetOption.mockClear();
    echartsResize.mockClear();
    echartsDispose.mockClear();
    echartsIsDisposed.mockClear();
    uPlotSetSize.mockClear();
    uPlotDestroy.mockClear();
  });

  it('discovers every widget package', () => {
    expect(widgetModulePaths).toHaveLength(22);
  });

  it('keeps chart and video-player widgets on dedicated runtime tests', () => {
    expect(widgetModulePaths.filter((modulePath) => !runtimeContractModulePaths.includes(modulePath))).toEqual([
      '../chart/echarts-bar/src/index.ts',
      '../chart/echarts-gauge/src/index.ts',
      '../chart/echarts-line/src/index.ts',
      '../chart/echarts-pie/src/index.ts',
      '../chart/uplot-line/src/index.ts',
      '../media/video-player/src/index.ts',
    ]);
  });

  for (const modulePath of runtimeContractModulePaths) {
    it(`${modulePath} mounts, updates, and destroys cleanly`, async () => {
      const moduleExports = await widgetModuleLoaders[modulePath]!();
      const widget = moduleExports.default ?? moduleExports.Main;

      expect(widget, `${modulePath} missing widget export`).toBeDefined();
      if (!widget) {
        throw new Error(`${modulePath} missing widget export`);
      }

      expect(widget.schema, `${modulePath} missing schema`).toBeDefined();
      expect(widget.controls, `${modulePath} missing controls`).toBeDefined();
      expect(widget.locales, `${modulePath} missing locales`).toMatchObject({
        en: expect.anything(),
        zh: expect.anything(),
      });

      const harness = mountWidget(widget, { locale: 'en' });
      expect(harness.element).toBeInstanceOf(HTMLElement);

      harness.update({
        locale: 'zh',
        props: widget.standaloneDefaults ?? {},
      });

      harness.destroy();
      expect(document.body.children).toHaveLength(0);
    });
  }
});
