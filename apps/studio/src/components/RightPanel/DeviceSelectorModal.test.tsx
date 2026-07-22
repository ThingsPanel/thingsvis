import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DeviceSelectorModal } from './DeviceSelectorModal';

describe('DeviceSelectorModal request lifecycle', () => {
  let container: HTMLDivElement;
  let root: Root;
  let parentDescriptor: PropertyDescriptor | undefined;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    parentDescriptor = Object.getOwnPropertyDescriptor(window, 'parent');
    postMessage = vi.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    if (parentDescriptor) Object.defineProperty(window, 'parent', parentDescriptor);
    vi.useRealTimers();
  });

  it('does not repeat the same paged search when an inline result callback rerenders the parent', async () => {
    function Host() {
      const [, setResultCount] = useState(0);
      return (
        <DeviceSelectorModal
          open
          onOpenChange={() => undefined}
          groups={[]}
          selectedGroupId="__all__"
          onGroupChange={() => undefined}
          onDevicesLoaded={() => setResultCount((count) => count + 1)}
          onSelect={() => undefined}
        />
      );
    }

    await act(async () => root.render(<Host />));
    await act(async () => vi.advanceTimersByTime(300));

    const searchCalls = () =>
      postMessage.mock.calls.filter(
        ([message]) => message?.type === 'thingsvis:searchDevicesPaged',
      );
    expect(searchCalls()).toHaveLength(1);
    const request = searchCalls()[0]?.[0];

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'tv:search-devices-paged-result',
            payload: {
              reqId: request.payload.reqId,
              devices: [{ deviceId: 'device-1', deviceName: '设备 1' }],
              total: 1,
              page: 1,
              pageSize: 10,
            },
          },
        }),
      );
    });
    await act(async () => vi.advanceTimersByTime(1000));

    expect(searchCalls()).toHaveLength(1);
    expect(container.textContent).toContain('设备 1');
  });
});
