/**
 * Unit tests for PropertyResolver
 *
 * Critical business flow: When a user saves/updates a data source or changes a bound
 * widget property, PropertyResolver.resolve() must return the correct value so that
 * the widget overlay (both CanvasView and GridStackCanvas) can re-render it.
 *
 * Bugs guarded against:
 *   - Static props not being returned as-is (identity)
 *   - Data-bound expressions ({{ ds.id.data.field }}) not resolving to live DS values
 *   - Bound value taking precedence over static prop with same key
 *   - JS transform snippet incorrectly applied
 *   - Missing/invalid DS not crashing (should fall back to static prop)
 */

import { PropertyResolver } from '../src/engine/PropertyResolver';
import type { NodeState } from '@thingsvis/kernel';

// Helper to construct a minimal NodeState
function makeNode(props: Record<string, any>, data?: any[]): NodeState {
  return {
    id: 'test-node',
    visible: true,
    locked: false,
    error: undefined,
    schemaRef: {
      id: 'test-node',
      type: 'test/widget',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      props,
      data: data ?? [],
    } as any,
  } as NodeState;
}

describe('PropertyResolver', () => {
  // ── Static props ───────────────────────────────────────────────────────────

  describe('static props (no bindings)', () => {
    it('returns static props unchanged', () => {
      const node = makeNode({ fontSize: 16, color: '#ff0000', title: 'Hello' });
      const result = PropertyResolver.resolve(node, {});

      expect(result.fontSize).toBe(16);
      expect(result.color).toBe('#ff0000');
      expect(result.title).toBe('Hello');
    });

    it('returns empty object when props is empty', () => {
      const node = makeNode({});
      const result = PropertyResolver.resolve(node, {});
      expect(result).toEqual({});
    });

    it('preserves boolean and null props', () => {
      const node = makeNode({ enabled: true, disabled: false, nothing: null });
      const result = PropertyResolver.resolve(node, {});
      expect(result.enabled).toBe(true);
      expect(result.disabled).toBe(false);
      // null is kept as-is (not overriding)
    });
  });

  // ── Inline expression binding in prop value ────────────────────────────────

  describe('inline {{ }} expressions in prop values', () => {
    const dataSources = {
      sensor: { data: { temperature: 42.5, unit: '°C' }, status: 'connected' },
    };

    it('resolves {{ ds.sensor.data.temperature }} in a string prop', () => {
      const node = makeNode({ value: '{{ ds.sensor.data.temperature }}' });
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.value).toBe(42.5);
    });

    it('resolves expression embedded in a template string prop', () => {
      const node = makeNode({
        label: 'Temp: {{ ds.sensor.data.temperature }}{{ ds.sensor.data.unit }}',
      });
      const result = PropertyResolver.resolve(node, dataSources);
      // ExpressionEvaluator evaluates the whole string — result may be the first match value
      // We just assert the resolution happened (not a raw template string)
      expect(result.label).not.toContain('{{');
    });

    it('leaves props without {{ }} unchanged', () => {
      const node = makeNode({ title: 'Static Title' });
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.title).toBe('Static Title');
    });

    it('returns undefined/null gracefully when DS is missing', () => {
      const node = makeNode({ value: '{{ ds.missing.data.field }}' });
      // Empty data sources — no crash expected
      expect(() => PropertyResolver.resolve(node, {})).not.toThrow();
    });
  });

  // ── Explicit DataBinding entries (node.data array) ────────────────────────

  describe('explicit DataBinding entries (node.schemaRef.data)', () => {
    const dataSources = {
      power: {
        data: { current: 3.7, voltage: 220, status: 'OK' },
        status: 'connected',
      },
    };

    it('overwrites static prop when a DataBinding targets the same key', () => {
      const node = makeNode(
        { value: 0 }, // static fallback
        [{ targetProp: 'value', expression: '{{ ds.power.data.current }}' }],
      );
      const result = PropertyResolver.resolve(node, dataSources);
      // Bound value (3.7) takes precedence over static (0)
      expect(result.value).toBe(3.7);
    });

    it('overwrites embedded sample data with real bound data', () => {
      const node = makeNode({ data: [{ name: 'Sample', value: 1 }] }, [
        { targetProp: 'data', expression: '{{ ds.power.data.series }}' },
      ]);
      const result = PropertyResolver.resolve(node, {
        power: { data: { series: [{ name: 'Real', value: 9 }] } },
      });

      expect(result.data).toEqual([{ name: 'Real', value: 9 }]);
    });

    it('keeps an empty real array instead of falling back to sample data', () => {
      const node = makeNode({ data: [{ name: 'Sample', value: 1 }] }, [
        { targetProp: 'data', expression: '{{ ds.power.data.series }}' },
      ]);
      const result = PropertyResolver.resolve(node, {
        power: { data: { series: [] } },
      });

      expect(result.data).toEqual([]);
    });

    it('resolves nested data path', () => {
      const node = makeNode({}, [
        { targetProp: 'voltage', expression: '{{ ds.power.data.voltage }}' },
      ]);
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.voltage).toBe(220);
    });

    it('keeps static prop when no DataBinding targets it', () => {
      const node = makeNode({ color: '#00ff00', value: 0 }, [
        { targetProp: 'value', expression: '{{ ds.power.data.current }}' },
      ]);
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.color).toBe('#00ff00'); // untouched
      expect(result.value).toBe(3.7); // overwritten by binding
    });

    it('does NOT overwrite prop when resolved value is undefined (missing path)', () => {
      const node = makeNode({ value: 99 }, [
        { targetProp: 'value', expression: '{{ ds.power.data.nonexistent }}' },
      ]);
      const result = PropertyResolver.resolve(node, dataSources);
      // The binding resolves to undefined → static prop 99 should remain
      expect(result.value).toBe(99);
    });

    it('handles multiple DataBindings for different props', () => {
      const node = makeNode({}, [
        { targetProp: 'current', expression: '{{ ds.power.data.current }}' },
        { targetProp: 'voltage', expression: '{{ ds.power.data.voltage }}' },
      ]);
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.current).toBe(3.7);
      expect(result.voltage).toBe(220);
    });
  });

  // ── JS transform on DataBinding ───────────────────────────────────────────

  describe('DataBinding with JS transform', () => {
    const dataSources = {
      meter: { data: { value: 0.75 }, status: 'connected' },
    };

    it('applies transform: value * 100 → percentage', () => {
      const node = makeNode({}, [
        {
          targetProp: 'percent',
          expression: '{{ ds.meter.data.value }}',
          transform: 'value * 100',
        },
      ]);
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.percent).toBeCloseTo(75);
    });

    it('falls back to raw value when transform throws', () => {
      const node = makeNode({}, [
        {
          targetProp: 'x',
          expression: '{{ ds.meter.data.value }}',
          transform: 'THIS IS NOT VALID JS !!!',
        },
      ]);
      expect(() => PropertyResolver.resolve(node, dataSources)).not.toThrow();
      // Raw value should be used as fallback
      const result = PropertyResolver.resolve(node, dataSources);
      expect(result.x).toBe(0.75);
    });

    it('infers the datasource snapshot from canonical field bindings when transform needs sibling fields', () => {
      const node = makeNode({ data: { value: 0, name: 'fallback' } }, [
        {
          targetProp: 'data',
          expression: '{{ ds.dashboard.data.device_total }}',
          transform:
            "({ value: Number(((Number(data?.device_online ?? 0) / Math.max(Number(value ?? 0), 1)) * 100).toFixed(2)), name: '设备在线率(%)' })",
        },
      ]);
      const result = PropertyResolver.resolve(node, {
        dashboard: {
          data: {
            device_total: 216,
            device_online: 9,
          },
          status: 'connected',
        },
      });

      expect(result.data).toEqual({
        value: 4.17,
        name: '设备在线率(%)',
      });
    });
  });

  // ── Live data source update scenario ──────────────────────────────────────

  describe('data source update propagation (the original bug scenario)', () => {
    it('reflects updated DS data on second call (simulates save+reconnect)', () => {
      const node = makeNode({ value: 0 }, [
        { targetProp: 'value', expression: '{{ ds.sensor.data.reading }}' },
      ]);

      const dsV1 = { sensor: { data: { reading: 100 } } };
      const dsV2 = { sensor: { data: { reading: 200 } } }; // updated after save

      const resultV1 = PropertyResolver.resolve(node, dsV1);
      const resultV2 = PropertyResolver.resolve(node, dsV2);

      expect(resultV1.value).toBe(100);
      expect(resultV2.value).toBe(200); // must reflect new value
    });
  });
});
