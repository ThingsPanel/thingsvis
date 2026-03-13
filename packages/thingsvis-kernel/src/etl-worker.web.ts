import { PageSchema } from '@thingsvis/schema';

declare const self: {
  postMessage(msg: unknown): void;
  addEventListener(type: string, listener: (e: MessageEvent) => void): void;
};

function handleMessage(msg: unknown) {
  try {
    const parsed = PageSchema.parse(msg);
    self.postMessage({ type: 'page', page: parsed });
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err) });
  }
}

self.addEventListener('message', (e: MessageEvent) => handleMessage(e.data));

export {}; // web worker entry
