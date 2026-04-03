import { describe, expect, it } from 'vitest';
import {
  buildOrthogonalRoute,
  simplifyOrthogonal,
  buildCurvedPathD,
  pointsToPathD,
} from '../src/routing';

describe('routing', () => {
  describe('buildOrthogonalRoute', () => {
    it('creates horizontal route between left/right anchors', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 0 };
      const route = buildOrthogonalRoute(start, end, 'right', 'left');
      expect(route).toEqual([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ]);
    });

    it('creates vertical route between top/bottom anchors', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 0, y: 100 };
      const route = buildOrthogonalRoute(start, end, 'bottom', 'top');
      expect(route).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ]);
    });

    it('handles waypoints', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const waypoints = [{ x: 50, y: 20 }, { x: 50, y: 80 }];
      const route = buildOrthogonalRoute(start, end, 'right', 'left', waypoints);
      expect(route.length).toBeGreaterThan(0);
      expect(route[0]).toEqual(start);
      expect(route[route.length - 1]).toEqual(end);
    });
  });

  describe('simplifyOrthogonal', () => {
    it('removes collinear points', () => {
      const route = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ];
      const simplified = simplifyOrthogonal(route);
      expect(simplified).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ]);
    });

    it('does not force reset when length > 4', () => {
      const route = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
        { x: 150, y: 100 }, // 6 points
      ];
      const simplified = simplifyOrthogonal(route);
      expect(simplified.length).toBe(6);
      expect(simplified).toEqual(route);
    });
  });

  describe('buildCurvedPathD', () => {
    it('generates a valid cubic bezier curve path', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const d = buildCurvedPathD(start, end);
      expect(d).toMatch(/^M 0 0 C [\d.]+ [\d.]+ [\d.]+ [\d.]+ 100 100$/);
    });
  });

  describe('pointsToPathD', () => {
    it('converts point array to path string', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      const d = pointsToPathD(points);
      expect(d).toBe('M 0 0 L 100 0 L 100 100');
    });
  });
});
