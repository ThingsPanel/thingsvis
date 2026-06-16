/**
 * Tests for the dynamic payload expression resolution in executeActions.
 *
 * Covers:
 * - Static JSON (backward compat)
 * - {{expr}} mustache templates
 * - Full JS expressions
 * - Payload context injection
 */
import { describe, it, expect } from 'vitest';
import {
  _resolvePayload as resolvePayload,
  _resolveTemplateExpressions as resolveTemplateExpressions,
} from '../src/engine/executeActions';

const baseContext = {
  payload: true,
  vars: {},
  ds: {},
  Math,
  JSON,
  random: Math.random,
};

// ─── resolveTemplateExpressions ──────────────────────────────────────

describe('resolveTemplateExpressions', () => {
  it('replaces a single {{expr}} with evaluated result', () => {
    const result = resolveTemplateExpressions("{{payload ? 'on' : 'off'}}", baseContext);
    expect(result).toBe('on');
  });

  it('replaces {{expr}} returning false payload', () => {
    const ctx = { ...baseContext, payload: false };
    const result = resolveTemplateExpressions("{{payload ? 'on' : 'off'}}", ctx);
    expect(result).toBe('off');
  });

  it('handles multiple {{expr}} in a JSON string', () => {
    const tpl = '{"a": "{{payload ? 1 : 0}}", "b": "{{payload}}"}';
    const result = resolveTemplateExpressions(tpl, baseContext);
    expect(result).toBe('{"a": "1", "b": "true"}');
  });

  it('replaces {{expr}} with empty string when result is null', () => {
    const result = resolveTemplateExpressions('{{null}}', baseContext);
    expect(result).toBe('');
  });

  it('JSON-stringifies object results', () => {
    const result = resolveTemplateExpressions('{{({x:1})}}}', baseContext);
    // The first }} matches the mustache, leaving one extra }
    expect(result).toContain('"x":1');
  });
});

// ─── resolvePayload ─────────────────────────────────────────────────

describe('resolvePayload', () => {
  it('returns non-string values unchanged', () => {
    expect(resolvePayload(42, baseContext)).toBe(42);
    expect(resolvePayload({ a: 1 }, baseContext)).toEqual({ a: 1 });
    expect(resolvePayload(null, baseContext)).toBeNull();
  });

  it('resolves static JSON', () => {
    const result = resolvePayload('{"key": "value"}', baseContext);
    expect(result).toEqual({ key: 'value' });
  });

  it('resolves mustache templates in JSON', () => {
    const result = resolvePayload(
      '{"Identify": "{{payload ? \'TurnOn\' : \'TurnOff\'}}"}',
      baseContext
    );
    expect(result).toEqual({ Identify: 'TurnOn' });
  });

  it('resolves mustache templates with false payload', () => {
    const ctx = { ...baseContext, payload: false };
    const result = resolvePayload(
      '{"Identify": "{{payload ? \'TurnOn\' : \'TurnOff\'}}"}',
      ctx
    );
    expect(result).toEqual({ Identify: 'TurnOff' });
  });

  it('resolves full JS expression as payload', () => {
    const result = resolvePayload(
      'payload ? {Identify: "TurnOn"} : {Identify: "TurnOff"}',
      baseContext
    );
    expect(result).toEqual({ Identify: 'TurnOn' });
  });

  it('resolves full JS expression with false payload', () => {
    const ctx = { ...baseContext, payload: false };
    const result = resolvePayload(
      'payload ? {Identify: "TurnOn"} : {Identify: "TurnOff"}',
      ctx
    );
    expect(result).toEqual({ Identify: 'TurnOff' });
  });

  it('resolves {{payload}} as the raw event value', () => {
    const result = resolvePayload('{{payload}}', baseContext);
    expect(result).toBe(true);
  });

  it('resolves numeric payload in expression', () => {
    const ctx = { ...baseContext, payload: 42 };
    const result = resolvePayload('payload * 2', ctx);
    expect(result).toBe(84);
  });

  it('resolves variable references', () => {
    const ctx = { ...baseContext, vars: { threshold: 100 } };
    const result = resolvePayload('{"limit": "{{vars.threshold}}"}', ctx);
    // After mustache resolution: {"limit": "100"}
    expect(result).toEqual({ limit: '100' });
  });

  it('passes through plain strings that are not valid JSON or expressions', () => {
    const result = resolvePayload('hello world', baseContext);
    expect(result).toBe('hello world');
  });

  it('normalizes legacy escaped auto-write object expressions', () => {
    const result = resolvePayload('({ \\"switch\\": payload })', baseContext);
    expect(result).toEqual({ switch: true });
  });

  it('normalizes legacy expression-derived auto-write keys', () => {
    const result = resolvePayload(`({ "switch ? '1' : '0'": payload })`, baseContext);
    expect(result).toEqual({ switch: true });
  });

  it('normalizes legacy nested command expressions before evaluation fallback', () => {
    const playbackPayload = {
      type: 'cloud',
      channel_no: 1,
      start_time: 1718000000,
      end_time: 1718080000,
    };
    const result = resolvePayload(
      '({ playback: { method: "playback", params: { type: "cloud2", channel_no: 1, start_time: Math.floor(new Date(payload.playback.start).getTime() / 1000), end_time: Math.floor(new Date(payload.playback.end).getTime() / 1000) } } })',
      { ...baseContext, payload: playbackPayload },
    );

    expect(result).toEqual({ playback: playbackPayload });
  });

  it('uses legacy nested command params when the old event payload shape is still available', () => {
    const result = resolvePayload(
      '({ playback: { method: "playback", params: { type: "cloud2", channel_no: 1, start_time: Math.floor(new Date(payload.playback.start).getTime() / 1000), end_time: Math.floor(new Date(payload.playback.end).getTime() / 1000) } } })',
      {
        ...baseContext,
        payload: {
          playback: {
            start: '2024-06-10T00:00:00.000Z',
            end: '2024-06-11T00:00:00.000Z',
          },
        },
      },
    );

    expect(result).toEqual({
      playback: {
        type: 'cloud2',
        channel_no: 1,
        start_time: 1717977600,
        end_time: 1718064000,
      },
    });
  });

  it('preserves static command wrapper expressions that do not depend on event payload', () => {
    const result = resolvePayload(
      '({ reboot: { method: "reboot", params: { delay: 3 } } })',
      baseContext,
    );

    expect(result).toEqual({ reboot: { method: 'reboot', params: { delay: 3 } } });
  });

  it('handles complex IoT control payload with full JS expression', () => {
    const ctx = { ...baseContext, payload: true };
    // For complex payloads with nested JSON strings, use full JS expression mode
    const expr = '({device_id: "d75c60e2-xxx", Identify: payload ? "TurnOn" : "TurnOff", value: JSON.stringify({switch: payload ? 1 : 0})})';
    const result = resolvePayload(expr, ctx);
    expect(result).toEqual({
      device_id: 'd75c60e2-xxx',
      Identify: 'TurnOn',
      value: '{"switch":1}',
    });
  });

  it('handles simple IoT control payload with mustache', () => {
    const ctx = { ...baseContext, payload: true };
    // Mustache is great for simple value substitution in JSON
    const tpl = '{"device_id": "d75c60e2-xxx", "Identify": "{{payload ? \'TurnOn\' : \'TurnOff\'}}", "switch": {{payload ? 1 : 0}}}';
    const result = resolvePayload(tpl, ctx);
    expect(result).toEqual({
      device_id: 'd75c60e2-xxx',
      Identify: 'TurnOn',
      switch: 1,
    });
  });
});
