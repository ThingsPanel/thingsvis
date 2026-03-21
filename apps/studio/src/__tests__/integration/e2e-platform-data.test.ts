/**
 * E2E Integration Tests: Platform Data Chain
 * doc-02 — ThingsVis 侧
 *
 * 测试策略: 直接创建 PlatformFieldAdapter 实例，模拟 postMessage，
 * 验证数据是否正确流入 adapter 内部状态。
 * 不启动真实 iframe，不依赖网络。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformFieldAdapter } from '@thingsvis/kernel';

type PlatformWriteMessage = {
  type: 'tv:platform-write';
  payload: {
    dataSourceId: string;
    data: Record<string, unknown>;
  };
};

// Helper: 模拟 host → ThingsVis iframe 的 postMessage
function simulateHostMessage(data: unknown) {
  const event = new MessageEvent('message', { data });
  window.dispatchEvent(event);
}

// Helper: 等待微任务队列（让 updateData / emitData 等异步操作完成）
const flushMicro = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('E2E-01~02: 实时数据推送', () => {
  let adapter: PlatformFieldAdapter;
  let emittedData: Record<string, unknown>;

  beforeEach(async () => {
    adapter = new PlatformFieldAdapter();
    emittedData = {};

    // BaseAdapter 使用 onData() 订阅
    adapter.onData((data: unknown) => {
      Object.assign(emittedData, data as Record<string, unknown>);
    });

    await adapter.connect({
      id: '__platform__',
      type: 'PLATFORM_FIELD',
      name: 'Platform',
      config: {
        source: 'platform',
        fieldMappings: {},
        bufferSize: 0,
      },
    });
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  it('E2E-01: 单字段推送 → emittedData 包含对应字段值', async () => {
    simulateHostMessage({
      type: 'tv:platform-data',
      payload: { fieldId: 'temperature', value: 25.3, timestamp: Date.now() },
    });

    await flushMicro();
    expect(emittedData.temperature).toBe(25.3);
  });

  it('E2E-02: 多次推送不同字段 → 所有字段均正确', async () => {
    simulateHostMessage({
      type: 'tv:platform-data',
      payload: { fieldId: 'temperature', value: 25 },
    });
    simulateHostMessage({ type: 'tv:platform-data', payload: { fieldId: 'humidity', value: 60 } });

    await flushMicro();
    expect(emittedData.temperature).toBe(25);
    expect(emittedData.humidity).toBe(60);
  });

  it('E2E-07: 事件字段（JSON 值）正确传递', async () => {
    const alarmPayload = { active: true, level: 'critical', message: '温度超限' };
    simulateHostMessage({
      type: 'tv:platform-data',
      payload: { fieldId: 'alarm_high_temp', value: alarmPayload },
    });

    await flushMicro();
    expect(emittedData.alarm_high_temp).toEqual(alarmPayload);
  });
});

describe('E2E-03: 历史数据回填', () => {
  let adapter: PlatformFieldAdapter;
  let emittedData: Record<string, unknown>;

  beforeEach(async () => {
    adapter = new PlatformFieldAdapter();
    emittedData = {};

    adapter.onData((data: unknown) => {
      Object.assign(emittedData, data as Record<string, unknown>);
    });

    // 启用环形缓冲 (bufferSize=100)
    await adapter.connect({
      id: '__platform__',
      type: 'PLATFORM_FIELD',
      name: 'Platform',
      config: {
        source: 'platform',
        fieldMappings: {},
        bufferSize: 100,
      },
    });
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  it('E2E-03: tv:platform-history → 环形缓冲正确填充，__history 键暴露', async () => {
    const history = [
      { value: 24.1, ts: 1710316800000 },
      { value: 24.5, ts: 1710316860000 },
      { value: 25.3, ts: 1710316920000 },
    ];

    simulateHostMessage({
      type: 'tv:platform-history',
      payload: { fieldId: 'temperature', history },
    });

    await flushMicro();

    // 最新值应被设为历史最后一条
    expect(emittedData.temperature).toBe(25.3);
    // history 数组以 __history 后缀暴露
    expect(emittedData.temperature__history).toEqual(history);
  });

  it('E2E-03b: bufferSize=0 时忽略历史消息', async () => {
    const adapterNoBuffer = new PlatformFieldAdapter();
    const noBufferData: Record<string, unknown> = {};
    adapterNoBuffer.onData((d: unknown) =>
      Object.assign(noBufferData, d as Record<string, unknown>),
    );

    await adapterNoBuffer.connect({
      id: '__platform__',
      type: 'PLATFORM_FIELD',
      name: 'Platform',
      config: { source: 'platform', fieldMappings: {}, bufferSize: 0 },
    });

    simulateHostMessage({
      type: 'tv:platform-history',
      payload: { fieldId: 'temperature', history: [{ value: 25, ts: Date.now() }] },
    });

    await flushMicro();
    expect(noBufferData.temperature__history).toBeUndefined();
    await adapterNoBuffer.disconnect();
  });

  it('E2E-03c: frozen history payload does not break later realtime append', async () => {
    const frozenHistory = Object.freeze([
      { value: 24.1, ts: 1710316800000 },
      { value: 24.5, ts: 1710316860000 },
    ]);

    simulateHostMessage({
      type: 'tv:platform-history',
      payload: { fieldId: 'temperature', history: frozenHistory },
    });
    simulateHostMessage({
      type: 'tv:platform-data',
      payload: { fieldId: 'temperature', value: 25.3, timestamp: 1710316920000 },
    });

    await flushMicro();
    expect(emittedData.temperature).toBe(25.3);
    expect(emittedData.temperature__history).toEqual([
      { value: 24.1, ts: 1710316800000 },
      { value: 24.5, ts: 1710316860000 },
      { value: 25.3, ts: 1710316920000 },
    ]);
  });
});

describe('E2E-08~09: 旧格式向后兼容', () => {
  it('E2E-09: 非 tv:platform-data 消息被静默忽略（不抛出异常）', () => {
    expect(() => {
      simulateHostMessage({ type: 'some-other-message', payload: {} });
      simulateHostMessage({ type: null });
      simulateHostMessage(null);
    }).not.toThrow();
  });

  it('E2E-08: tv:init 含 thingModelBindings 不触发 PlatformFieldAdapter 更新', async () => {
    const adapter = new PlatformFieldAdapter();
    const receivedData: Record<string, unknown> = {};
    adapter.onData((d: unknown) => Object.assign(receivedData, d as Record<string, unknown>));

    await adapter.connect({
      id: '__platform__',
      type: 'PLATFORM_FIELD',
      name: 'Platform',
      config: { source: 'platform', fieldMappings: {}, bufferSize: 0 },
    });

    // 发送含旧 thingModelBindings 字段的消息 —— 应被 adapter 忽略
    simulateHostMessage({
      type: 'tv:init',
      payload: {
        thingModelBindings: [{ nodeId: 'node1', fieldId: 'temp', propKey: 'value' }],
      },
    });
    await flushMicro();

    // PlatformFieldAdapter 不处理 tv:init，receivedData 应为空
    expect(Object.keys(receivedData)).toHaveLength(0);
    await adapter.disconnect();
  });
});

describe('E2E-04: 反向写回 (tv:platform-write)', () => {
  it('E2E-04: write() 向 parent 发送正确格式的 tv:platform-write', async () => {
    const adapter = new PlatformFieldAdapter();
    await adapter.connect({
      id: '__platform__',
      type: 'PLATFORM_FIELD',
      name: 'Platform',
      config: { source: 'platform', fieldMappings: {}, bufferSize: 0 },
    });

    // 在 jsdom 中 window.parent === window，spy 其 postMessage
    const capturedMessages: unknown[] = [];
    const spy = vi.spyOn(window, 'postMessage').mockImplementation((msg) => {
      capturedMessages.push(msg);
    });

    await adapter.write({ switch: true });

    expect(capturedMessages).toHaveLength(1);
    const msg = capturedMessages[0] as PlatformWriteMessage;
    expect(msg.type).toBe('tv:platform-write');
    expect(msg.payload.dataSourceId).toBe('__platform__');
    expect(msg.payload.data).toEqual({ switch: true });

    spy.mockRestore();
    await adapter.disconnect();
  });
});
