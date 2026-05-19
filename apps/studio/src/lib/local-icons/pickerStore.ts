import type { LocalIconPickResult } from './types';

export type LocalIconPickerRequest = {
  value: string;
  onConfirm: (result: LocalIconPickResult) => void;
  onCancel?: () => void;
};

type Listener = (request: LocalIconPickerRequest | null) => void;

let activeRequest: LocalIconPickerRequest | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(activeRequest);
  }
}

export function subscribeLocalIconPicker(listener: Listener): () => void {
  listeners.add(listener);
  listener(activeRequest);
  return () => listeners.delete(listener);
}

export function openLocalIconPicker(request: LocalIconPickerRequest): void {
  activeRequest = request;
  notify();
}

export function closeLocalIconPicker(): void {
  activeRequest = null;
  notify();
}

export function getLocalIconPickerRequest(): LocalIconPickerRequest | null {
  return activeRequest;
}
