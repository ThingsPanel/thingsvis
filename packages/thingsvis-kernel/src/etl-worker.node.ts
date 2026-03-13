import { parentPort } from 'worker_threads';
import { PageSchema } from '@thingsvis/schema';

function handleMessage(msg: unknown) {
  try {
    const parsed = PageSchema.parse(msg);
    if (parentPort) parentPort.postMessage({ type: 'page', page: parsed });
  } catch (err) {
    if (parentPort) parentPort.postMessage({ type: 'error', error: String(err) });
  }
}

if (parentPort) {
  parentPort.on('message', handleMessage);
}

export {}; // node-only worker
